/**
 * Regression Tests: QR Scan Handler
 *
 * - malformed / insufficient payloads -> 400
 * - every QR format actually produced by the platform scans successfully
 *   ({id,role}, {a,p,t}, plain ObjectId, PDF ticket URL)
 * - check-in is atomic: a second concurrent scan gets 409
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockAgendaFindById = vi.fn()
const mockParticipantFindById = vi.fn()
const mockParticipantUpdateOne = vi.fn()
const mockCommitteeFindById = vi.fn()
const mockCommitteeUpdateOne = vi.fn()

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: { findById: (...args: unknown[]) => mockAgendaFindById(...args) }
}))
vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: {
    findById: (...args: unknown[]) => mockParticipantFindById(...args),
    updateOne: (...args: unknown[]) => mockParticipantUpdateOne(...args),
  }
}))
vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: {
    findById: (...args: unknown[]) => mockCommitteeFindById(...args),
    updateOne: (...args: unknown[]) => mockCommitteeUpdateOne(...args),
  }
}))
vi.mock('../../../server/utils/agendaAuth', () => ({
  ensureCommitteeOrOrganizer: vi.fn()
}))
vi.mock('@upstash/qstash', () => ({
  Client: class {
    publishJSON = vi.fn().mockResolvedValue({})
  },
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).getRouterParam = vi.fn().mockReturnValue('60d5ecb8b392cb3a8c8e1113');
;(globalThis as any).createError = (opts: { statusCode: number; message?: string; statusMessage?: string }) => {
  const err = new Error(opts.message || opts.statusMessage) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({
  public: { public_uri: 'http://localhost:3000' },
});

const PID = '60d5ecb8b392cb3a8c8e2222'
const AGENDA_ID = '60d5ecb8b392cb3a8c8e1113'

describe('Agenda QR Scan Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).readBody.mockReset()
    mockParticipantFindById.mockReset()
    mockCommitteeFindById.mockReset()
    mockParticipantUpdateOne.mockReset()
    mockCommitteeUpdateOne.mockReset()
  })

  const loadHandler = async () =>
    (await import('../../../server/api/agenda/[id]/scan.post')).default

  const stubHappyPath = () => {
    mockAgendaFindById.mockResolvedValue({
      _id: AGENDA_ID,
      title: 'Test',
      configuration: { participant: { pay: false } },
    })
    // Self-returning thenable: handler chains .populate().populate()
    const stub: any = {
      populate: vi.fn(() => stub),
    }
    stub.then = (onFulfilled?: (v: unknown) => unknown) =>
      Promise.resolve({
        _id: PID,
        agendaId: AGENDA_ID,
        visiting: false,
        member: { fullName: 'Budi', email: 'budi@example.com', NIM: 123 },
        guest: null,
      }).then(onFulfilled)
    mockParticipantFindById.mockReturnValue(stub)
    mockParticipantUpdateOne.mockResolvedValue({ modifiedCount: 1 })
  }

  it('should return 400 Bad Request when QR code is not valid and matches nothing', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ code: '{ id: 123, role: Participant }' })

    const handler = await loadHandler()
    await expect(handler({ context: { user: {} } } as any)).rejects.toMatchObject({
      statusCode: 400,
      message: 'QR Code tidak valid',
    })
  })

  it('should return 400 for non-ObjectId ids', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ code: '{"id":"123"}' })

    const handler = await loadHandler()
    await expect(handler({ context: { user: {} } } as any)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('scans the participant ticket-screen format {a, p, t:"p"}', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({
      code: JSON.stringify({ a: AGENDA_ID, p: PID, t: 'p' }),
    })
    stubHappyPath()

    const handler = await loadHandler()
    const res = await handler({ context: { user: {} } } as any)

    expect(res.status).toBe('success')
    expect(mockParticipantUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: PID, visiting: { $ne: true } }),
      expect.objectContaining({ $set: expect.objectContaining({ visiting: true }) })
    )
  })

  it('scans a plain ObjectId payload', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ code: PID })
    stubHappyPath()

    const handler = await loadHandler()
    const res = await handler({ context: { user: {} } } as any)
    expect(res.status).toBe('success')
  })

  it('scans the PDF ticket URL format', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({
      code: `https://himatika.org/verify/ticket/${PID}`,
    })
    stubHappyPath()

    const handler = await loadHandler()
    const res = await handler({ context: { user: {} } } as any)
    expect(res.status).toBe('success')
  })

  it('returns 409 when the atomic check-in finds the ticket already used', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ code: PID })
    stubHappyPath()
    mockParticipantUpdateOne.mockResolvedValue({ modifiedCount: 0 })

    const handler = await loadHandler()
    await expect(handler({ context: { user: {} } } as any)).rejects.toMatchObject({
      statusCode: 409,
    })
  })
})
