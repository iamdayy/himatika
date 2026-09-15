/**
 * Unit tests for session lifecycle: sid-bound access tokens, refresh-token
 * rotation, reuse detection, and signature-verified signout.
 */
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../server/models/SessionModel', () => ({
  SessionModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    exists: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
  }
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({ jwtSecret: 'test-secret' })

const SECRET = 'test-secret'
const USER_ID = '507f1f77bcf86cd799439011'

describe('Sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checkSession accepts a legacy token (no sid) while any session row exists', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { checkSession } = await import('../../../server/utils/Sessions')

    vi.mocked(SessionModel.exists).mockResolvedValue({ _id: 's1' } as any)

    const legacyToken = jwt.sign(
      { user: USER_ID, username: 'u', member: { NIM: 1 } },
      SECRET,
      { expiresIn: '5m' }
    )

    const result = await checkSession(legacyToken)
    expect(result.username).toBe('u')
    expect(vi.mocked(SessionModel.exists)).toHaveBeenCalledWith({ user: USER_ID })
  })

  it('checkSession rejects a token whose sid session was revoked', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { checkSession } = await import('../../../server/utils/Sessions')

    // Session row gone (revoked).
    vi.mocked(SessionModel.findOne).mockResolvedValue(null as any)

    const boundToken = jwt.sign(
      { user: USER_ID, username: 'u', member: null, sid: 'session-abc' },
      SECRET,
      { expiresIn: '5m' }
    )

    await expect(checkSession(boundToken)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Session revoked',
    })
  })

  it('refresh rotates the refresh token and binds the new access token via sid', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const oldRefresh = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    const save = vi.fn().mockResolvedValue(undefined)
    const sessionDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshToken: oldRefresh,
      save,
    }
    vi.mocked(SessionModel.findOne).mockResolvedValue(sessionDoc)

    // Heavy populate path
    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    const result = await refreshSession(oldRefresh)

    expect(result.token).not.toBe(result.refreshToken)
    expect(result.refreshToken).not.toBe(oldRefresh)          // rotated!
    expect(save).toHaveBeenCalledOnce()

    // New access token carries the sid claim.
    const decoded = jwt.verify(result.token, SECRET) as any
    expect(decoded.sid).toBe('session-abc')
    expect(decoded.user).toBe(USER_ID)
  })

  it('reuse inside the grace window returns fresh tokens without revoking', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const oldRefresh = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    const currentRefresh = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    const rotatedDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshToken: currentRefresh,
      previousRefreshToken: oldRefresh,
      rotatedAt: new Date(),
    }
    vi.mocked(SessionModel.findOne).mockImplementation(async (query: any) => {
      if (query?.refreshToken) return null // already rotated away
      if (query?.previousRefreshToken === oldRefresh) return rotatedDoc
      return null
    })

    // Heavy populate path for the grace branch
    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    const result = await refreshSession(oldRefresh)

    expect(result.refreshToken).toBe(currentRefresh) // no new rotation
    const decoded = jwt.verify(result.token, SECRET) as any
    expect(decoded.sid).toBe('session-abc')
    expect(vi.mocked(SessionModel.deleteOne)).not.toHaveBeenCalled()
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
  })

  it('reuse outside the grace window revokes only the affected session', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession, REFRESH_GRACE_WINDOW_MS } = await import('../../../server/utils/Sessions')

    const rotatedAway = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    const staleDoc: any = {
      _id: 'session-abc',
      rotatedAt: new Date(Date.now() - REFRESH_GRACE_WINDOW_MS - 1000),
    }
    vi.mocked(SessionModel.findOne).mockImplementation(async (query: any) => {
      if (query?.refreshToken) return null // no longer stored
      if (query?.previousRefreshToken === rotatedAway) return staleDoc
      return null
    })
    vi.mocked(SessionModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

    await expect(refreshSession(rotatedAway)).rejects.toMatchObject({ statusCode: 401 })
    expect(vi.mocked(SessionModel.deleteOne)).toHaveBeenCalledWith({ _id: 'session-abc' })
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
  })

  it('exitSession ignores forged access payloads instead of wiping sessions', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { exitSession } = await import('../../../server/utils/Sessions')

    const forged = jwt.sign({ user: 'victim-id' }, 'wrong-secret') // bad signature

    const result = await exitSession(forged)
    expect(result).toBe(true)
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
    expect(vi.mocked(SessionModel.deleteOne)).not.toHaveBeenCalled()
  })

  it('exitSession with a valid sid-bound token deletes only that session', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { exitSession } = await import('../../../server/utils/Sessions')

    const token = jwt.sign({ user: USER_ID, sid: 'session-abc' }, SECRET, { expiresIn: '5m' })
    vi.mocked(SessionModel.deleteOne).mockResolvedValue({ deletedCount: 1 } as any)

    await exitSession(token)
    expect(vi.mocked(SessionModel.deleteOne)).toHaveBeenCalledWith({ _id: 'session-abc' })
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
  })
})
