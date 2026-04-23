import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '@/lib/logger'

const originalEnv = process.env

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('production mode (NODE_ENV=production)', () => {
    beforeEach(() => {
      process.env = { ...originalEnv, NODE_ENV: 'production' }
    })

    it('emits info as JSON to console.log', () => {
      logger.info('test message', { key: 'value' })
      expect(logSpy).toHaveBeenCalledOnce()
      const output = JSON.parse(logSpy.mock.calls[0][0] as string)
      expect(output).toMatchObject({ level: 'info', message: 'test message', key: 'value', service: 'agon-web' })
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('emits debug as JSON to console.log', () => {
      logger.debug('debug msg')
      expect(logSpy).toHaveBeenCalledOnce()
      const output = JSON.parse(logSpy.mock.calls[0][0] as string)
      expect(output.level).toBe('debug')
    })

    it('emits warn as JSON to console.error', () => {
      logger.warn('watch out', { code: 'WARN_001' })
      expect(errorSpy).toHaveBeenCalledOnce()
      const output = JSON.parse(errorSpy.mock.calls[0][0] as string)
      expect(output).toMatchObject({ level: 'warn', message: 'watch out', code: 'WARN_001' })
    })

    it('emits error as JSON to console.error', () => {
      logger.error('payment failed', { orderId: 'ord-123', amount: 99.9 })
      expect(errorSpy).toHaveBeenCalledOnce()
      const output = JSON.parse(errorSpy.mock.calls[0][0] as string)
      expect(output).toMatchObject({ level: 'error', message: 'payment failed', orderId: 'ord-123', amount: 99.9 })
    })

    it('always includes service=agon-web and a valid ISO timestamp', () => {
      logger.info('any message')
      const output = JSON.parse(logSpy.mock.calls[0][0] as string)
      expect(output.service).toBe('agon-web')
      expect(() => new Date(output.timestamp)).not.toThrow()
      expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp)
    })

    it('spreads context fields directly into the JSON entry', () => {
      logger.error('checkout error', { step: 'payment', retries: 3 })
      const output = JSON.parse(errorSpy.mock.calls[0][0] as string)
      expect(output.step).toBe('payment')
      expect(output.retries).toBe(3)
    })

    it('works without context argument', () => {
      expect(() => logger.info('no context')).not.toThrow()
      const output = JSON.parse(logSpy.mock.calls[0][0] as string)
      expect(output.message).toBe('no context')
    })

    it('does not call console.log for error level', () => {
      logger.error('err')
      expect(logSpy).not.toHaveBeenCalled()
    })

    it('does not call console.error for info level', () => {
      logger.info('info')
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })

  describe('development / test mode (NODE_ENV=test)', () => {
    it('emits info as formatted string to console.log', () => {
      logger.info('hello world', { userId: '1' })
      expect(logSpy).toHaveBeenCalledOnce()
      const msg = logSpy.mock.calls[0][0] as string
      expect(msg).toContain('[INFO]')
      expect(msg).toContain('hello world')
    })

    it('emits error as formatted string to console.error', () => {
      logger.error('something broke')
      expect(errorSpy).toHaveBeenCalledOnce()
      const msg = errorSpy.mock.calls[0][0] as string
      expect(msg).toContain('[ERROR]')
      expect(msg).toContain('something broke')
    })

    it('emits warn to console.error', () => {
      logger.warn('low stock')
      expect(errorSpy).toHaveBeenCalledOnce()
    })

    it('emits debug to console.log', () => {
      logger.debug('trace info')
      expect(logSpy).toHaveBeenCalledOnce()
    })

    it('passes context as second argument to console', () => {
      logger.info('msg', { requestId: 'req-abc' })
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), { requestId: 'req-abc' })
    })
  })
})
