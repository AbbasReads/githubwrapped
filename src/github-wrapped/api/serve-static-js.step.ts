// Serve JS Static Files
import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getStaticAsset, getStaticContent } from '../static-assets.js'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ServeStaticJS',
  description: 'Serves JS files from bundled assets',
  flows: ['github-wrapped'],
  method: 'GET',
  path: '/static/js/:filename',
  responseSchema: {
    200: z.any(),
    404: z.object({ error: z.string() }),
  },
  emits: [],
}

export const handler: Handlers['ServeStaticJS'] = async (req, { logger }) => {
  const { filename } = req.pathParams
  const assetPath = `js/${filename}`

  logger.info('Serving JS file', { filename })

  const asset = getStaticAsset(assetPath)
  
  if (!asset) {
    logger.warn('JS file not found', { filename, assetPath })
    return { status: 404, body: { error: `File "${filename}" not found` } }
  }

  const content = getStaticContent(assetPath)
  
  return {
    status: 200,
    headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=31536000' },
    body: content,
  }
}
