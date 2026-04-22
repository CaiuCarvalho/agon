type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function log(level: LogLevel, message: string, context?: LogContext): void {
  const entry = {
    level,
    message,
    service: 'agon-web',
    timestamp: new Date().toISOString(),
    ...context,
  }

  // JSON output in production for PM2 / Grafana Loki ingestion.
  // Human-readable in development.
  if (process.env.NODE_ENV === 'production') {
    const fn = level === 'error' || level === 'warn' ? console.error : console.log
    fn(JSON.stringify(entry))
  } else {
    const fn = level === 'error' || level === 'warn' ? console.error : console.log
    fn(`[${level.toUpperCase()}] ${message}`, context ?? '')
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info:  (message: string, context?: LogContext) => log('info',  message, context),
  warn:  (message: string, context?: LogContext) => log('warn',  message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
}
