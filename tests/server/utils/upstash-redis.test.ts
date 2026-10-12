/**
 * Unit tests for the Upstash Redis helpers.
 *
 * Redis is an optional cache everywhere it is used: every helper must
 * resolve to a null-ish fallback instead of hanging or throwing when
 * Upstash is slow, unreachable, or unconfigured — otherwise a slow Redis
 * burns the whole serverless function budget and surfaces as 504s that
 * clients read as "logged out".
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

;(globalThis as any).useRuntimeConfig = () => ({
  upstashRedisRestUrl: 'https://example.upstash.io',
  upstashRedisRestToken: 'test-token',
});

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('upstashRedis', () => {
  it('resolves null instead of hanging when Upstash never responds', async () => {
    // A fetch that hangs but honors the abort signal, like a real one.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: unknown, opts?: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts?.signal?.addEventListener('abort', () =>
              reject(new DOMException('This operation was aborted', 'AbortError'))
            );
          })
      )
    )

    const { redisGetJson } = await import('../../../server/utils/upstashRedis')
    const startedAt = Date.now()
    const result = await redisGetJson('session:abc')
    const elapsed = Date.now() - startedAt

    expect(result).toBeNull()
    // The 3s request timeout must fire — far below any function timeout.
    expect(elapsed).toBeLessThan(10_000)
  })

  it('resolves null when the request fails outright', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    const { redisSetJson } = await import('../../../server/utils/upstashRedis')
    await expect(
      redisSetJson('k', { a: 1 }, 60)
    ).resolves.toBe(false)
  })

  it('resolves null when Redis is not configured', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({});
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { redisGetJson } = await import('../../../server/utils/upstashRedis')
    await expect(redisGetJson('k')).resolves.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
