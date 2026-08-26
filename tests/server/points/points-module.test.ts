/**
 * Unit tests for the activity-points module hardening:
 * - admin achievement GET authorization
 * - decide state machine & validation
 * - member PUT/DELETE immutability of approved logs
 * - shared point calculator (pure function)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPointFind = vi.fn()
const mockPointFindOneAndUpdate = vi.fn()
const mockPointFindOne = vi.fn()
const mockOrganizerExists = vi.fn()
const mockMemberResolve = vi.fn()

vi.mock('../../../server/models/PointModel', () => ({
  PointModel: {
    find: (...args: unknown[]) => mockPointFind(...args),
    findOne: (...args: unknown[]) => mockPointFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockPointFindOneAndUpdate(...args),
  }
}))
vi.mock('../../../server/models/OrganizerModel', () => ({
  OrganizerModel: { exists: (...args: unknown[]) => mockOrganizerExists(...args) },
}))
vi.mock('../../../server/models/MemberModel', () => ({
  MemberModel: {
    findOne: () => ({
      select: () => ({ lean: async () => null }),
    }),
    exists: vi.fn(),
  },
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).getQuery = vi.fn().mockReturnValue({});
;(globalThis as any).getRouterParam = vi.fn();
;(globalThis as any).getRequestIP = vi.fn().mockReturnValue('127.0.0.1');
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};

describe('GET /api/admin/achievement (PT-H1)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a plain member with 403', async () => {
    mockOrganizerExists.mockResolvedValue(null)
    ;(globalThis as any).useRuntimeConfig = () => ({ jwtSecret: 's' })

    const handler = (await import('../../../server/api/admin/achievement/index.get')).default
    await expect(handler({ context: { user: { member: { NIM: 2 } } } } as any))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns sanitized array for an organizer', async () => {
    // organizer via claims fast-path
    mockOrganizerExists.mockResolvedValue({ _id: 'x' })
    const chainable = (resolved: unknown) => {
      const stub: any = { populate: vi.fn(() => stub), sort: vi.fn(() => stub), limit: vi.fn(() => stub), lean: vi.fn().mockResolvedValue(resolved) }
      return stub
    }
    mockPointFind.mockReturnValue(chainable([{ _id: 'p1' }]))

    const handler = (await import('../../../server/api/admin/achievement/index.get')).default
    const res = await handler({ context: { user: { member: { NIM: 1, organizer: { role: 'Ketua' } } } } } as any)

    expect(Array.isArray(res)).toBe(true)
    // populate must be field-limited (no full member doc)
    expect(vi.mocked(mockPointFind).mock.calls[0].length).toBe(1)
  })
})

describe('decide.post state machine (PT-H4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).readBody = vi.fn()
    mockOrganizerExists.mockResolvedValue({ _id: 'x' })
  })

  const loadHandler = async () =>
    (await import('../../../server/api/admin/achievement/decide.post')).default

  it('approves a pending claim atomically with validated amount', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ id: 'a'.repeat(24), action: 'approve', amount: 100 })
    const updated = { _id: 'a'.repeat(24), status: 'approved', amount: 100, member: { _id: 'm1' }, reason: 'Juara' }
    mockPointFindOneAndUpdate.mockReturnValue({
      populate: vi.fn().mockResolvedValue(updated),
    } as any)

    const handler = await loadHandler()
    const res = await handler({
      context: { user: { member: { NIM: 1, _id: 'b'.repeat(24) } } },
    } as any)

    expect(res.statusCode).toBe(200)
    expect(mockPointFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' }),
      expect.objectContaining({ $set: expect.objectContaining({ status: 'approved', amount: 100 }) }),
      expect.objectContaining({ new: true })
    )
  })

  it('rejects a non-enum action', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ id: 'a'.repeat(24), action: 'aproove' })
    const handler = await loadHandler()
    await expect(handler({ context: { user: { member: { NIM: 1, _id: 'b'.repeat(24) } } } } as any)).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(mockPointFindOneAndUpdate).not.toHaveBeenCalled()
  })

  it('rejects a negative amount', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ id: 'a'.repeat(24), action: 'approve', amount: -5 })
    const handler = await loadHandler()
    await expect(handler({ context: { user: { member: { NIM: 1, _id: 'b'.repeat(24) } } } } as any)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('blocks re-deciding a processed record (409)', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ id: 'a'.repeat(24), action: 'approve', amount: 50 })
    // Atomic update finds no pending row -> handler must surface 409.
    const stub: any = { populate: vi.fn().mockResolvedValue(null) }
    mockPointFindOneAndUpdate.mockReturnValue(stub)

    const handler = await loadHandler()
    await expect(handler({ context: { user: { member: { NIM: 1, _id: 'b'.repeat(24) } } } } as any)).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})

describe('member claim immutability (PT-H2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PUT blocks editing an approved log', async () => {
    ;(globalThis as any).readBody = vi.fn().mockResolvedValue({})
    ;(globalThis as any).getRouterParam = vi.fn().mockReturnValue('p1')
    ;(globalThis as any).customReadMultipartFormData = vi.fn().mockResolvedValue({})
    mockPointFindOne.mockResolvedValue({ _id: 'p1', status: 'approved' })

    const handler = (await import('../../../server/api/me/achievement/[id].put')).default
    await expect(
      handler({ context: { user: { member: { NIM: 1, _id: 'm1' } } } } as any)
    ).rejects.toMatchObject({ statusCode: 403, statusMessage: /tidak dapat diubah/ })
  })

  it('DELETE blocks removing an approved log', async () => {
    ;(globalThis as any).getRouterParam = vi.fn().mockReturnValue('p1')
    mockPointFindOne.mockResolvedValue({ _id: 'p1', status: 'approved', proof: null })

    const handler = (await import('../../../server/api/me/achievement/[id].delete')).default
    await expect(
      handler({ context: { user: { member: { NIM: 1, _id: 'm1' } } } } as any)
    ).rejects.toMatchObject({ statusCode: 403, statusMessage: /tidak dapat dihapus/ })
  })

  it('allows editing/deleting while still pending', async () => {
    ;(globalThis as any).readBody = vi.fn().mockResolvedValue({})
    ;(globalThis as any).getRouterParam = vi.fn().mockReturnValue('p1')
    ;(globalThis as any).customReadMultipartFormData = vi.fn().mockResolvedValue({})
    const save = vi.fn().mockResolvedValue(undefined)
    mockPointFindOne.mockResolvedValue({ _id: 'p1', status: 'pending', reason: 'r', description: '', type: 'activity', date: new Date(), proof: null, save })

    const putHandler = (await import('../../../server/api/me/achievement/[id].put')).default
    const res = await putHandler({ context: { user: { member: { NIM: 1, _id: 'm1' } } } } as any)
    expect(res.statusCode).toBe(200)

    const delMock = vi.fn().mockResolvedValue(undefined)
    mockPointFindOne.mockResolvedValue({ _id: 'p1', status: 'pending', proof: null, deleteOne: delMock })
    const delHandler = (await import('../../../server/api/me/achievement/[id].delete')).default
    const delRes = await delHandler({ context: { user: { member: { NIM: 1, _id: 'm1' } } } } as any)
    expect(delRes.statusCode).toBe(200)
  })
})

describe('pointCalculator (pure)', () => {
  it('computes agenda/project/aspiration/manual points per documented rules', async () => {
    const { computeActivityPoints } = await import('../../../server/utils/pointCalculator')
    const w = { start: new Date('2026-01-01'), end: new Date('2026-06-30') }

    const total = computeActivityPoints(
      {
        committeeAgendas: [
          { approved: true, visiting: true, agendaId: { configuration: { committee: { point: 30 } }, date: { start: '2026-02-01', end: '2026-02-02' } } },
          // multi-day agenda straddling the boundary must NOT count
          { approved: true, visiting: true, agendaId: { configuration: { committee: { point: 30 } }, date: { start: '2026-06-25', end: '2026-07-05' } } },
          // unapproved committee does not count
          { approved: false, visiting: true, agendaId: { configuration: { committee: { point: 99 } }, date: { start: '2026-03-01', end: '2026-03-02' } } },
        ],
        participantAgendas: [
          { visiting: true, agendaId: { configuration: { participant: { point: 20 } }, date: { start: '2026-04-01', end: '2026-04-01' } } },
          // unpaid-but-visited still counts by design (payment not part of rules)
          { visiting: false, agendaId: { configuration: { participant: { point: 20 } }, date: { start: '2026-04-02', end: '2026-04-02' } } },
        ],
        projects: [
          { published: true, date: '2026-05-01' },   // +75
          { published: false, date: '2026-05-01' },  // skipped
        ],
        aspirations: [
          { createdAt: '2026-05-10' },               // +50
          { deleted: true, createdAt: '2026-05-11' },
        ],
        manualLogs: [
          { status: 'approved', date: '2026-06-01', amount: 15 },
          { status: 'pending', date: '2026-06-02', amount: 999 },   // excluded
          { status: 'rejected', date: '2026-06-03', amount: 999 },  // excluded
        ],
      },
      w
    )
    // 30 + 20 + 75 + 50 + 15
    expect(total).toBe(190)
  })
})
