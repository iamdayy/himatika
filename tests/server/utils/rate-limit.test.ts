/**
 * Integration tests for the Mongo-backed rate limiter.
 *
 * Regression: Mongoose 9 throws "Cannot pass an array to query updates
 * unless the `updatePipeline` option is set" for aggregation-pipeline
 * updates without the explicit opt-in — which broke every request guarded
 * by enforceRateLimit (signin/otp-verify/register) at runtime.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'

describe('enforceRateLimit', () => {
  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  it('allows requests under the limit and counts each hit atomically', async () => {
    const { enforceRateLimit } = await import('../../../server/utils/rateLimit')
    const key = `test-key-ok-${Date.now()}`

    // Should not throw for the first `max` hits.
    for (let i = 0; i < 3; i++) {
      await expect(enforceRateLimit(key, 3, 60_000)).resolves.toBeUndefined()
    }
    // And must reject right after the budget is spent.
    await expect(enforceRateLimit(key, 3, 60_000)).rejects.toMatchObject({
      statusCode: 429,
    })
  })

  it('throws 429 once the window budget is exhausted', async () => {
    const { enforceRateLimit } = await import('../../../server/utils/rateLimit')
    const key = `test-key-429-${Date.now()}`

    await enforceRateLimit(key, 2, 60_000)
    await enforceRateLimit(key, 2, 60_000)
    await expect(enforceRateLimit(key, 2, 60_000)).rejects.toMatchObject({
      statusCode: 429,
    })
  })

  it('restarts the budget when the previous window expired', async () => {
    const { RateLimitModel } = await import('../../../server/utils/rateLimit')
    const { enforceRateLimit } = await import('../../../server/utils/rateLimit')
    const key = `test-key-expired-${Date.now()}`

    // Burn the budget...
    await enforceRateLimit(key, 1, 60_000)
    await expect(enforceRateLimit(key, 1, 60_000)).rejects.toMatchObject({ statusCode: 429 })

    // ...then age the window out so the limiter restarts at 1.
    await RateLimitModel.updateOne(
      { _id: key },
      { $set: { updatedAt: new Date(Date.now() - 120_000) } }
    )
    await expect(enforceRateLimit(key, 1, 60_000)).resolves.toBeUndefined()
    const doc = await RateLimitModel.findById(key).lean()
    expect(doc?.count).toBe(1)
  })
})
