import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import logger from '@/utils/logger'
import { isDevelopment } from '@/config'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  })

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.received
      }))
    })
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    })
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'External service is temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    })
  }

  if (error.code === 'ENOTFOUND') {
    return res.status(502).json({
      error: 'Bad Gateway',
      message: 'Unable to reach external service',
      code: 'BAD_GATEWAY'
    })
  }

  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  const response: any = {
    error: statusCode === 500 ? 'Internal Server Error' : message,
    message: statusCode === 500 ? 'Something went wrong' : message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  if (isDevelopment) {
    response.stack = error.stack
    response.details = error.details
  }

  if (error.code) {
    response.code = error.code
  }

  res.status(statusCode).json(response)
}

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.path} was not found`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'GET /api/rankings',
      'GET /api/collaborator/:address',
      'GET /api/stats',
      'GET /api/leaderboard',
      'GET /api/recent-activity',
      'GET /api/websocket/stats',
      'POST /api/broadcast',
      'GET /api/cache/status',
      'DELETE /api/cache/:key'
    ]
  })
}

export const createAppError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}