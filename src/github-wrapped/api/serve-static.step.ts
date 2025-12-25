// Serve Static Files API Step
// GET /static/:filename - Serves static files from bundled assets

import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getStaticAsset, getStaticContent } from '../static-assets.js'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ServeStatic',
  description: 'Serves static files from bundled assets',
  flows: ['github-wrapped'],
  method: 'GET',
  path: '/static/:filename',
  responseSchema: {
    200: z.any(),
    404: z.object({
      error: z.string(),
    }),
  },
  emits: [],
}

export const handler: Handlers['ServeStatic'] = async (req, { logger }) => {
  const { filename } = req.pathParams

  logger.info('Serving static file', { filename })

  try {
    const asset = getStaticAsset(filename)
    
    if (!asset) {
      logger.warn('Static file not found', { filename })
      return {
        status: 404,
        body: { error: `File "${filename}" not found` },
      }
    }

    const content = getStaticContent(filename)

    return {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: content,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to serve static file', { error: errorMessage })
    return {
      status: 500,
      body: { error: `Failed to serve file: ${errorMessage}` },
    }
  }
}
