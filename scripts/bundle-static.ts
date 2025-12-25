#!/usr/bin/env npx ts-node
/**
 * Bundle Static Assets Script
 *
 * Reads files from public/ and generates a TypeScript module with embedded assets.
 * Run: npm run bundle-static
 */

import * as fs from 'fs'
import * as path from 'path'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')
const OUTPUT_FILE = path.resolve(process.cwd(), 'src/github-wrapped/static-assets.ts')
const COMPILED_OUTPUT = path.resolve(
  process.cwd(),
  '.motia/compiled/src/github-wrapped/static-assets.js'
)

const TEXT_EXTENSIONS = ['.html', '.css', '.js', '.svg', '.json', '.txt']
const BINARY_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.mp3', '.wav']

// Only skip index-original.html (not needed for deployment)
const SKIP_FILES = ['index-original.html']

interface AssetEntry {
  path: string
  content: string
  isBase64: boolean
  mimeType: string
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir))
    } else {
      files.push(path.relative(baseDir, fullPath))
    }
  }
  return files
}

function escapeContent(content: string): string {
  return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

function bundleAssets(): void {
  console.log('📦 Bundling static assets from public/...\n')

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error('❌ public/ directory not found!')
    process.exit(1)
  }

  const files = getAllFiles(PUBLIC_DIR)
  const assets: AssetEntry[] = []

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const fullPath = path.join(PUBLIC_DIR, file)
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
    const fileName = path.basename(file)

    if (SKIP_FILES.includes(fileName)) {
      console.log(`  ⏭ ${file} (skipped)`)
      continue
    }

    if (TEXT_EXTENSIONS.includes(ext)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      assets.push({ path: file, content, isBase64: false, mimeType })
      console.log(`  ✓ ${file} (text, ${content.length} chars)`)
    } else if (BINARY_EXTENSIONS.includes(ext)) {
      const content = fs.readFileSync(fullPath).toString('base64')
      assets.push({ path: file, content, isBase64: true, mimeType })
      console.log(`  ✓ ${file} (base64, ${content.length} chars)`)
    } else {
      console.log(`  ⚠ ${file} (skipped, unknown extension)`)
    }
  }

  // Generate TypeScript module
  let output = `// Auto-generated - do not edit manually
export interface StaticAsset { content: string; isBase64: boolean; mimeType: string }
export const STATIC_ASSETS: Record<string, StaticAsset> = {\n`

  for (const asset of assets) {
    const escaped = escapeContent(asset.content)
    output += `  '${asset.path}': { content: \`${escaped}\`, isBase64: ${asset.isBase64}, mimeType: '${asset.mimeType}' },\n`
  }

  output += `}
export function getStaticAsset(filePath: string): StaticAsset | undefined {
  return STATIC_ASSETS[filePath.replace(/^\\/+/, '')]
}
export function getStaticContent(filePath: string): Buffer | string | undefined {
  const asset = getStaticAsset(filePath)
  if (!asset) return undefined
  return asset.isBase64 ? Buffer.from(asset.content, 'base64') : asset.content
}
`

  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(OUTPUT_FILE, output)

  // Generate JS version
  let jsOutput = `// Auto-generated - do not edit manually
export const STATIC_ASSETS = {\n`

  for (const asset of assets) {
    const escaped = escapeContent(asset.content)
    jsOutput += `  '${asset.path}': { content: \`${escaped}\`, isBase64: ${asset.isBase64}, mimeType: '${asset.mimeType}' },\n`
  }

  jsOutput += `}
export function getStaticAsset(filePath) {
  return STATIC_ASSETS[filePath.replace(/^\\/+/, '')]
}
export function getStaticContent(filePath) {
  const asset = getStaticAsset(filePath)
  if (!asset) return undefined
  return asset.isBase64 ? Buffer.from(asset.content, 'base64') : asset.content
}
`

  const compiledDir = path.dirname(COMPILED_OUTPUT)
  if (!fs.existsSync(compiledDir)) fs.mkdirSync(compiledDir, { recursive: true })
  fs.writeFileSync(COMPILED_OUTPUT, jsOutput)

  console.log(`\n✅ Generated ${OUTPUT_FILE}`)
  console.log(`✅ Generated ${COMPILED_OUTPUT}`)
  console.log(`   ${assets.length} assets bundled`)
}

bundleAssets()
