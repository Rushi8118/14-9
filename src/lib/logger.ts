import { logActivity } from './activity-logger'

/**
 * Simple logger utility for development and production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = import.meta.env.DEV

const createLogger = () => {
  const log = (level: LogLevel, ...args: any[]) => {
    if (level === 'error' || level === 'warn') {
      try {
        const message = args.map((a) => (a instanceof Error ? a.message : typeof a === 'string' ? a : '')).filter(Boolean).join(' ').slice(0, 200)
        const stack = args.find((a) => a instanceof Error)?.stack?.slice(0, 2000)
        logActivity(level === 'error' ? 'api_error' : 'app', message || `Application ${level}`, null, { level, stack })
      } catch {
        // never fail logging
      }
    }
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    if (isDevelopment) {
      switch (level) {
        case 'error':
          console.error(prefix, ...args)
          break
        case 'warn':
          console.warn(prefix, ...args)
          break
        case 'info':
          console.info(prefix, ...args)
          break
        case 'debug':
          console.debug(prefix, ...args)
          break
      }
    } else {
      // In production, optionally send to error tracking service
      if (level === 'error') {
        console.error(prefix, ...args)
      }
    }
  }

  return {
    debug: (...args: any[]) => log('debug', ...args),
    info: (...args: any[]) => log('info', ...args),
    warn: (...args: any[]) => log('warn', ...args),
    error: (...args: any[]) => log('error', ...args),
  }
}

export const logger = createLogger()
