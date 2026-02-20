import winston from 'winston'
import { appConfig } from '@/config'

const { combine, timestamp, errors, json, colorize, simple } = winston.format

const logger = winston.createLogger({
  level: appConfig.LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'ranking-backend' },
  transports: [
    new winston.transports.File({
      filename: appConfig.LOG_FILE.replace('.log', '.error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: appConfig.LOG_FILE,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
})

if (appConfig.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
      })
    )
  }))
}

export default logger