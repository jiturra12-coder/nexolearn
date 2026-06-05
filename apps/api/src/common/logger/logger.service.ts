import { Logger, createLogger, format, transports } from 'winston'

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
)

const logTransports = [
  new transports.Console({
    format: format.combine(
      format.colorize(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : ''
        return `${timestamp} [${level}]: ${message} ${metaStr}`
      }),
    ),
  }),
]

if (process.env.NODE_ENV === 'production') {
  logTransports.push(
    new transports.File({ filename: 'logs/error.log', level: 'error', format: logFormat }),
    new transports.File({ filename: 'logs/combined.log', format: logFormat }),
  )
}

export function createLogger(label: string): Logger {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'nexolearn-api', context: label },
    transports: logTransports,
  })
}

export const logger = createLogger('AppLogger')
