/**
 * Unit tests for the serverless MongoDB connection guard.
 *
 * Regression (production, Vercel): with `bufferCommands: false` and a
 * stale cached promise, queries after a freeze/thaw disconnect threw
 * "Cannot call findOne() before initial connection is complete".
 * The guard must reconnect on demand, share one in-flight attempt, and
 * self-invalidate dead handles so later calls retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConnect = vi.fn()
const mockConnection = { readyState: 0 }

vi.mock('mongoose', () => ({
  default: {
    connect: (...args: unknown[]) => mockConnect(...args),
    connection: mockConnection,
  },
}))

;(globalThis as any).useRuntimeConfig = () => ({
  mongodb_uri: 'mongodb://127.0.0.1:27017/himatika_test',
  dbName: 'himatika_test',
});

describe('ensureDbConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnection.readyState = 0
    ;(globalThis as any).__mongooseConnAttempt = undefined
  })

  it('does nothing when already connected', async () => {
    mockConnection.readyState = 1

    const { ensureDbConnection } = await import('../../../server/utils/db')
    await ensureDbConnection()

    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('shares a single in-flight attempt across concurrent callers', async () => {
    let resolveConnect!: (value: unknown) => void
    mockConnect.mockImplementation(
      () => new Promise((resolve) => { resolveConnect = resolve })
    )

    const { ensureDbConnection } = await import('../../../server/utils/db')
    const p1 = ensureDbConnection()
    const p2 = ensureDbConnection()
    const p3 = ensureDbConnection()

    expect(mockConnect).toHaveBeenCalledTimes(1)
    resolveConnect({})
    await Promise.all([p1, p2, p3])
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('retries with a fresh attempt after a failure', async () => {
    mockConnect.mockRejectedValueOnce(new Error('dial failed'))
    mockConnect.mockResolvedValueOnce({})

    const { ensureDbConnection } = await import('../../../server/utils/db')
    await expect(ensureDbConnection()).rejects.toThrow('dial failed')
    await ensureDbConnection()

    expect(mockConnect).toHaveBeenCalledTimes(2)
  })

  it('discards a settled handle when disconnected (freeze/thaw)', async () => {
    // A leftover finished attempt from before the socket died.
    ;(globalThis as any).__mongooseConnAttempt = {
      promise: Promise.resolve({}),
      settled: true,
    }
    mockConnection.readyState = 0
    mockConnect.mockResolvedValue({})

    const { ensureDbConnection } = await import('../../../server/utils/db')
    await ensureDbConnection()

    expect(mockConnect).toHaveBeenCalledTimes(1)
  })
})
