/**
 * Test: Payment Verification Race Condition
 *
 * Ensures that if a payment is verified concurrently, only one request
 * succeeds, or both are idempotent, preventing double QStash events
 * or E-Ticket generations. Also guards the committee/organizer
 * authorization added to this endpoint.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: { findById: vi.fn() }
}))
vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn()
  }
}))
vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: {
    findOneAndUpdate: vi.fn(),
    findById: vi.fn()
  }
}))
vi.mock('../../../server/utils/agendaAuth', () => ({
  ensureCommitteeOrOrganizer: vi.fn()
}))
vi.mock('../../../server/utils/himatikaPdfWorker', () => ({
  himatikaPdfWorker: { generateTicket: vi.fn() }
}))
vi.mock('../../../server/utils/whatsapp', () => ({
  sendWhatsappFile: vi.fn()
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode: number, statusMessage: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({
  jwtSecret: 'test-secret',
  public: { public_uri: 'http://localhost:3000' },
  public_uri: 'http://localhost:3000'
});

describe('Payment Verification Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // The handler chains .populate() on findOneAndUpdate's query builder.
  // A self-returning thenable stub works for any number of .populate() calls.
  const queryStub = (resolved: unknown) => {
    const stub: any = { populate: vi.fn(() => stub) }
    stub.then = (onFulfilled?: (v: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled)
    return stub
  }

  it('should prevent double processing if payment is already success', async () => {
    const payload = { registeredId: 'reg123', status: 'success' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

    // Atomic transition finds nothing: payment is already success.
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    vi.mocked(ParticipantModel.findOneAndUpdate).mockReturnValue(queryStub(null))

    const { CommitteeModel } = await import('../../../server/models/CommitteeModel')
    vi.mocked(CommitteeModel.findOneAndUpdate).mockReturnValue(queryStub(null))

    const mockSave = vi.fn()
    vi.mocked(ParticipantModel.findById).mockResolvedValue({
      _id: 'reg123',
      payment: { status: 'success', method: 'manual_transfer' },
      member: { fullName: 'Test', email: 'test@test.com' },
      save: mockSave
    } as any)

    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    vi.mocked(AgendaModel.findById).mockResolvedValue({ _id: 'agenda123', title: 'Test' } as any)

    const handler = (await import('../../../server/api/agenda/[id]/payment/verify.post')).default
    const event = { context: { params: { id: 'agenda123' }, user: { member: { NIM: 123 } } } }

    // The handler surfaces errors by RETURNING an H3Error (Nitro turns that
    // into an error response), so the promise resolves with the error object.
    const result = await handler(event as any)

    expect(result).toMatchObject({
      statusCode: 400,
      statusMessage: 'Payment is already processed',
    })

    expect(mockSave).not.toHaveBeenCalled()
  })

  it('should enforce committee/organizer authorization before mutating', async () => {
    const payload = { registeredId: 'reg123', status: 'success' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    vi.mocked(ParticipantModel.findOneAndUpdate).mockResolvedValue(null)
    const { CommitteeModel } = await import('../../../server/models/CommitteeModel')
    vi.mocked(CommitteeModel.findOneAndUpdate).mockResolvedValue(null)

    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    vi.mocked(AgendaModel.findById).mockResolvedValue({ _id: 'agenda123', title: 'Test' } as any)

    const handler = (await import('../../../server/api/agenda/[id]/payment/verify.post')).default
    const user = { member: { NIM: 123 } }
    const event = { context: { params: { id: 'agenda123' }, user } }

    await handler(event as any)

    const { ensureCommitteeOrOrganizer } = await import('../../../server/utils/agendaAuth')
    expect(vi.mocked(ensureCommitteeOrOrganizer)).toHaveBeenCalledWith('agenda123', user)
  })

  it('should only transition pending manual_transfer payments atomically', async () => {
    const payload = { registeredId: 'reg123', status: 'success' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

    const updated = {
      _id: 'reg123',
      payment: { status: 'success', method: 'manual_transfer' },
      member: { fullName: 'Test', email: 'test@test.com' }
    }
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    vi.mocked(ParticipantModel.findOneAndUpdate).mockReturnValue(queryStub(updated))

    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    vi.mocked(AgendaModel.findById).mockResolvedValue({ _id: 'agenda123', title: 'Test' } as any)

    const handler = (await import('../../../server/api/agenda/[id]/payment/verify.post')).default
    const event = { context: { params: { id: 'agenda123' }, user: { member: { NIM: 123 } } } }

    const response = await handler(event as any)

    expect(response.statusCode).toBe(200)
    expect(vi.mocked(ParticipantModel.findOneAndUpdate)).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'reg123',
        'payment.status': { $in: ['pending', 'verifying'] },
        'payment.method': 'manual_transfer'
      }),
      { $set: { 'payment.status': 'success' } },
      { new: true }
    )
  })
})
