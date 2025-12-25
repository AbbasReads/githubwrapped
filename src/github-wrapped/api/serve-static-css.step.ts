// Serve CSS Static Files
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getStaticAsset, getStaticContent } from '../static-assets.js'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ServeStaticCSS',
  description: 'Serves CSS files from bundled assets',
  flows: ['github-wrapped'],
  method: 'GET',
  path: '/static/css/:filename',
  responseSchema: {
    200: z.any(),
    404: z.object({ error: z.string() }),
  },
  emits: [],
}

export const handler: Handlers['ServeStaticCSS'] = async (req, { logger }) => {
  const { filename } = req.pathParams
  const assetPath = `css/${filename}`

  logger.info('Serving CSS file', { filename })

  const asset = getStaticAsset(assetPath)
  
  if (!asset) {
    logger.warn('CSS file not found', { filename, assetPath })
    return { status: 404, body: { error: `File "${filename}" not found` } }
  }

  const content = getStaticContent(assetPath)
  
  return {
    status: 200,
    headers: { 'Content-Type': 'text/css', 'Cache-Control': 'public, max-age=31536000' },
    body: content,
  }
}
