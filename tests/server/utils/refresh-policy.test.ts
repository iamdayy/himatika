/**
 * Unit tests for the refresh-failure policy (app/utils/refreshPolicy).
 *
 * This is the decision core that keeps users logged in on Vercel:
 * only a 401 from the refresh endpoint ends the session; transient
 * failures (cold starts, timeouts, 5xx) must be retried, never logout.
 */
import { describe, it, expect } from 'vitest'
import {
  REFRESH_RETRY_DELAYS_MS,
  getRefreshErrorStatus,
  isRetryableRefreshError,
} from '../../../app/utils/refreshPolicy'

describe('refreshPolicy', () => {
  it('extracts ofetch-style response statuses', () => {
    expect(getRefreshErrorStatus({ response: { status: 401 } })).toBe(401)
    expect(getRefreshErrorStatus({ response: { status: 503 } })).toBe(503)
  })

  it('extracts h3-style status codes', () => {
    expect(getRefreshErrorStatus({ statusCode: 401 })).toBe(401)
    expect(getRefreshErrorStatus({ statusCode: 500 })).toBe(500)
  })

  it('returns null for network-level failures and garbage', () => {
    expect(getRefreshErrorStatus(new TypeError('fetch failed'))).toBeNull()
    expect(getRefreshErrorStatus(null)).toBeNull()
    expect(getRefreshErrorStatus(undefined)).toBeNull()
    expect(getRefreshErrorStatus('boom')).toBeNull()
    expect(getRefreshErrorStatus({ response: {} })).toBeNull()
  })

  it('never retries a 401 (genuinely invalid token)', () => {
    expect(isRetryableRefreshError({ response: { status: 401 } })).toBe(false)
    expect(isRetryableRefreshError({ statusCode: 401 })).toBe(false)
    expect(isRetryableRefreshError({ response: { status: 400 } })).toBe(false)
    expect(isRetryableRefreshError({ response: { status: 403 } })).toBe(false)
  })

  it('retries transient failures', () => {
    expect(isRetryableRefreshError(new TypeError('fetch failed'))).toBe(true)
    expect(isRetryableRefreshError({ response: { status: 500 } })).toBe(true)
    expect(isRetryableRefreshError({ response: { status: 504 } })).toBe(true)
    expect(isRetryableRefreshError({ statusCode: 429 })).toBe(true)
  })

  it('defines a bounded backoff schedule', () => {
    expect(REFRESH_RETRY_DELAYS_MS.length).toBeGreaterThan(0)
    expect(REFRESH_RETRY_DELAYS_MS.length).toBeLessThanOrEqual(3)
    for (const delay of REFRESH_RETRY_DELAYS_MS) {
      expect(delay).toBeGreaterThan(0)
    }
  })
})
