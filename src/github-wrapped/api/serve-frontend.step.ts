// Serve Frontend API Step
// GET /app - Serves the GitHub Wrapped frontend

import { ApiRouteConfig, Handlers } from 'motia'
import { z } from 'zod'
import { getStaticContent } from '../static-assets.js'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'ServeFrontend',
  description: 'Serves the GitHub Wrapped frontend HTML',
  flows: ['github-wrapped'],
  method: 'GET',
  path: '/app',
  responseSchema: {
    200: { type: 'string' },
  },
  emits: [],
}

export const handler: Handlers['ServeFrontend'] = async (req, { logger }) => {
  logger.info('Serving frontend')

  try {
    const html = getStaticContent('index.html')

    if (!html) {
      throw new Error('index.html not found in bundled assets')
    }

    return {
      status: 200 as const,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
      body: html,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Failed to serve frontend', { error: errorMessage })
    return {
      status: 200 as const,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `<html><body><h1>Error loading frontend</h1><p>${errorMessage}</p></body></html>`,
    }
  }
}
