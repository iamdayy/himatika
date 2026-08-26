/**
 * Unit tests for OTP verification: consume-once, failed-attempt lockout,
 * and correct error semantics.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockOTPFindOne = vi.fn()
const mockOTPUpdateOne = vi.fn()
const mockOTPDeleteOne = vi.fn()
const mockMemberFindOne = vi.fn()
const mockUserFindOne = vi.fn()

vi.mock('../../../server/models/OTPModel', () => ({
  OTPModel: {
    findOne: (...args: unknown[]) => mockOTPFindOne(...args),
    updateOne: (...args: unknown[]) => mockOTPUpdateOne(...args),
    deleteOne: (...args: unknown[]) => mockOTPDeleteOne(...args),
  }
}))
vi.mock('../../../server/models/MemberModel', () => ({
  MemberModel: { findOne: (...args: unknown[]) => mockMemberFindOne(...args) }
}))
vi.mock('../../../server/models/UserModel', () => ({
  UserModel: { findOne: (...args: unknown[]) => mockUserFindOne(...args) }
}))
vi.mock('../../../server/utils/TokenHelper', () => ({
  generateToken: vi.fn().mockResolvedValue('hmac-token'),
}))
vi.mock('../../../server/utils/rateLimit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(undefined),
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({ public: { public_uri: 'http://localhost:3000' } });
;(globalThis as any).useTranslationServerMiddleware = async () => (key: string) => key;

const baseOtp = {
  _id: 'otp1',
  email: 'test@example.com',
  code: 'ABC123',
  NIM: 123456,
  type: 'Verify Account',
  attempts: 0,
  usedAt: null,
  expiresAt: new Date(Date.now() + 5 * 60_000),
}

const validBody = { email: 'test@example.com', code: 'ABC123', type: 'Verify Account' }

describe('OTP verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).readBody.mockResolvedValue(validBody)
    mockMemberFindOne.mockResolvedValue({ _id: 'm1', email: 'test@example.com' })
    mockUserFindOne.mockResolvedValue({ _id: 'u1' })
  })

  const loadHandler = async () =>
    (await import('../../../server/api/otp/verify.post')).default

  it('returns a token for a correct, unconsumed code', async () => {
    mockOTPFindOne.mockResolvedValue({ ...baseOtp })

    const handler = await loadHandler()
    const res = await handler({} as any)

    expect(res.statusCode).toBe(200)
    expect(res.data.token).toBe('hmac-token')
    expect(mockOTPDeleteOne).not.toHaveBeenCalled()
    expect(mockOTPUpdateOne).not.toHaveBeenCalled()
  })

  it('rejects an already-consumed code', async () => {
    mockOTPFindOne.mockResolvedValue({ ...baseOtp, usedAt: new Date() })

    const handler = await loadHandler()
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('counts failed attempts and burns the code at the limit', async () => {
    // 4th failure: crossing the lockout threshold.
    mockOTPFindOne.mockResolvedValue({ ...baseOtp, attempts: 4 })
    mockOTPUpdateOne.mockResolvedValue({ modifiedCount: 1 })
    mockOTPDeleteOne.mockResolvedValue({ deletedCount: 1 })

    ;(globalThis as any).readBody.mockResolvedValue({ ...validBody, code: 'WRONG1' })

    const handler = await loadHandler()
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 429 })
    expect(mockOTPDeleteOne).toHaveBeenCalledWith({ _id: 'otp1' })
  })

  it('a wrong code under the limit only increments attempts', async () => {
    mockOTPFindOne.mockResolvedValue({ ...baseOtp, attempts: 0 })
    mockOTPUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    ;(globalThis as any).readBody.mockResolvedValue({ ...validBody, code: 'WRONG1' })

    const handler = await loadHandler()
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockOTPUpdateOne).toHaveBeenCalledWith(
      { _id: 'otp1' },
      { $inc: { attempts: 1 } }
    )
    expect(mockOTPDeleteOne).not.toHaveBeenCalled()
  })
})
