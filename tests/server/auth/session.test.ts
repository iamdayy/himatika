/**
 * Unit tests for session lifecycle: sid-bound access tokens, refresh-token
 * rotation, reuse detection, and signature-verified signout.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { createHash } from 'node:crypto'

const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex')

vi.mock('../../../server/models/SessionModel', () => ({
  SessionModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    exists: vi.fn(),
    deleteOne: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
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
    const sessionDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshToken: oldRefresh,
    }
    vi.mocked(SessionModel.findOne).mockResolvedValue(sessionDoc)
    vi.mocked(SessionModel.findOneAndUpdate).mockResolvedValue({
      ...sessionDoc,
      refreshTokenHash: 'rotated-refresh-token-hash',
    } as any)

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
    expect(vi.mocked(SessionModel.findOneAndUpdate)).toHaveBeenCalledWith(
      { _id: 'session-abc', refreshToken: oldRefresh },
      expect.objectContaining({
        $set: expect.objectContaining({ refreshTokenHash: expect.any(String) }),
        $unset: { refreshToken: 1 },
      }),
      { new: true }
    )

    // New access token carries the sid claim.
    const decoded = jwt.verify(result.token, SECRET) as any
    expect(decoded.sid).toBe('session-abc')
    expect(decoded.user).toBe(USER_ID)
  })

  it('reuse of a rotated refresh token revokes every session of the user', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const rotatedAway = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    vi.mocked(SessionModel.findOne).mockResolvedValue(null as any) // no longer stored
    vi.mocked(SessionModel.deleteMany).mockResolvedValue({ deletedCount: 2 } as any)

    await expect(refreshSession(rotatedAway)).rejects.toMatchObject({ statusCode: 401 })
    expect(vi.mocked(SessionModel.deleteMany)).toHaveBeenCalledWith({ user: USER_ID })
  })

  it('revokes every session when an atomic refresh rotation loses a race', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const refreshToken = jwt.sign({ user: USER_ID }, SECRET, { expiresIn: '90d' })
    vi.mocked(SessionModel.findOne).mockResolvedValue({
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshToken,
    } as any)
    vi.mocked(SessionModel.findOneAndUpdate).mockResolvedValue(null as any)
    vi.mocked(SessionModel.deleteMany).mockResolvedValue({ deletedCount: 2 } as any)

    await expect(refreshSession(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Session not found or invalid',
    })
    expect(vi.mocked(SessionModel.deleteMany)).toHaveBeenCalledWith({ user: USER_ID })
  })

  it('honors a recently-rotated refresh token (grace window) without revoking', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    // Presented token was rotated out by a concurrent refresh moments ago.
    const supersededRefresh = jwt.sign({ user: USER_ID, jti: 'old' }, SECRET, { expiresIn: '90d' })
    const sessionDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshTokenHash: 'current-hash',
      previousRefreshTokenHashes: [hashToken(supersededRefresh)],
      previousRefreshTokenExpiresAt: new Date(Date.now() + 60_000),
    }
    vi.mocked(SessionModel.findOne).mockImplementation(async (query: any) => {
      // Current-token lookup misses; grace lookup hits.
      if (query?.previousRefreshTokenHashes) return sessionDoc
      return null
    })
    vi.mocked(SessionModel.findOneAndUpdate).mockResolvedValue({
      ...sessionDoc,
      refreshTokenHash: 'rotated-again-hash',
    } as any)

    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    const result = await refreshSession(supersededRefresh)

    expect(result.refreshToken).not.toBe(supersededRefresh)
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
    // Rotation records the superseded hash for the next concurrent retry.
    expect(vi.mocked(SessionModel.findOneAndUpdate)).toHaveBeenCalledWith(
      { _id: 'session-abc', refreshTokenHash: 'current-hash' },
      expect.objectContaining({
        $push: expect.objectContaining({ previousRefreshTokenHashes: expect.anything() }),
      }),
      { new: true }
    )
  })

  it('revokes every session when the grace window for an old token expired', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const staleRefresh = jwt.sign({ user: USER_ID, jti: 'stale' }, SECRET, { expiresIn: '90d' })
    vi.mocked(SessionModel.findOne).mockImplementation(async (query: any) => {
      if (query?.previousRefreshTokenHashes) {
        return {
          _id: 'session-abc',
          user: USER_ID,
          guest: null,
          refreshTokenHash: 'current-hash',
          previousRefreshTokenHashes: [hashToken(staleRefresh)],
          previousRefreshTokenExpiresAt: new Date(Date.now() - 1_000), // expired
        } as any
      }
      return null
    })
    vi.mocked(SessionModel.deleteMany).mockResolvedValue({ deletedCount: 1 } as any)

    await expect(refreshSession(staleRefresh)).rejects.toMatchObject({ statusCode: 401 })
    expect(vi.mocked(SessionModel.deleteMany)).toHaveBeenCalledWith({ user: USER_ID })
  })

  it('recovers a lost rotation race when the presented token is inside the grace window', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const refreshToken = jwt.sign({ user: USER_ID, jti: 'racer' }, SECRET, { expiresIn: '90d' })
    const presentedHash = hashToken(refreshToken)
    // First lookup sees the pre-race row; the re-fetch after losing the
    // race sees the winner's rotation (presented hash now in grace list).
    const preRaceDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshTokenHash: presentedHash,
      previousRefreshTokenHashes: [],
      previousRefreshTokenExpiresAt: new Date(Date.now() + 60_000),
    }
    const postRaceDoc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshTokenHash: 'winner-hash',
      previousRefreshTokenHashes: [presentedHash],
      previousRefreshTokenExpiresAt: new Date(Date.now() + 60_000),
    }
    let findOneCalls = 0
    vi.mocked(SessionModel.findOne).mockImplementation(async () => {
      findOneCalls += 1
      return findOneCalls === 1 ? preRaceDoc : postRaceDoc
    })
    vi.mocked(SessionModel.findOneAndUpdate)
      .mockResolvedValueOnce(null as any) // lost the race
      .mockResolvedValue({ ...postRaceDoc, refreshTokenHash: 'recovered-hash' } as any)

    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    const result = await refreshSession(refreshToken)

    expect(result.token).toBeTruthy()
    expect(result.refreshToken).not.toBe(refreshToken)
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
  })

  it('converges across several lost races without revoking', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const refreshToken = jwt.sign({ user: USER_ID, jti: 'stampede' }, SECRET, { expiresIn: '90d' })
    const presentedHash = hashToken(refreshToken)
    const mkDoc = (cur: string, prev: string[]): any => ({
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshTokenHash: cur,
      previousRefreshTokenHashes: prev,
      previousRefreshTokenExpiresAt: new Date(Date.now() + 60_000),
    })
    // Three racers ahead of us rotate H0 -> H1 -> H2 before our CAS lands.
    const docs = [mkDoc(presentedHash, []), mkDoc('winner-1', [presentedHash]), mkDoc('winner-2', ['winner-1', presentedHash])]
    let findOneCalls = 0
    vi.mocked(SessionModel.findOne).mockImplementation(async () => docs[Math.min(findOneCalls++, docs.length - 1)])
    vi.mocked(SessionModel.findOneAndUpdate)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValueOnce(null as any)
      .mockResolvedValue({ ...docs[2], refreshTokenHash: 'recovered-hash' } as any)

    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    const result = await refreshSession(refreshToken)

    expect(result.token).toBeTruthy()
    expect(result.refreshToken).not.toBe(refreshToken)
    expect(vi.mocked(SessionModel.deleteMany)).not.toHaveBeenCalled()
  })

  it('reports 429 (without revoking) when a grace-verified token keeps losing', async () => {
    const { SessionModel } = await import('../../../server/models/SessionModel')
    const { refreshSession } = await import('../../../server/utils/Sessions')

    const refreshToken = jwt.sign({ user: USER_ID, jti: 'contended' }, SECRET, { expiresIn: '90d' })
    const presentedHash = hashToken(refreshToken)
    const doc: any = {
      _id: 'session-abc',
      user: USER_ID,
      guest: null,
      refreshTokenHash: 'someone-elses-win',
      previousRefreshTokenHashes: [presentedHash],
      previousRefreshTokenExpiresAt: new Date(Date.now() + 60_000),
    }
    vi.mocked(SessionModel.findOne).mockResolvedValue(doc)
    vi.mocked(SessionModel.findOneAndUpdate).mockResolvedValue(null as any)
    vi.mocked(SessionModel.deleteMany).mockResolvedValue({ deletedCount: 0 } as any)

    const UserModelMod = await import('../../../server/models/UserModel')
    ;(UserModelMod.UserModel as any).findById = vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: USER_ID,
        username: 'u',
        member: { _id: 'm1', NIM: 123, fullName: 'Test', organizer: null },
        guest: null,
      }),
    })

    await expect(refreshSession(refreshToken)).rejects.toMatchObject({ statusCode: 429 })
    // Contention is transient: the session row must survive for the retry.
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
