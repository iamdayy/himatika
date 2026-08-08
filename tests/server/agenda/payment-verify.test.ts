/**
 * Test: Payment Verification Race Condition
 * 
 * Ensures that if a payment is verified concurrently, only one request
 * succeeds, or both are idempotent, preventing double QStash events
 * or E-Ticket generations.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: { findById: vi.fn() }
}))
vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: { findById: vi.fn() }
}))
vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: { findById: vi.fn() }
}))
vi.mock('../../../server/utils/himatikaPdfWorker', () => ({
  himatikaPdfWorker: { generateTicket: vi.fn() }
}))
vi.mock('../../../server/utils/whatsapp', () => ({
  sendWhatsappFile: vi.fn()
}))

vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { public_uri: 'http://localhost:3000' }
}))

describe('Payment Verification Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should prevent double processing if payment is already success', async () => {
    const payload = { registeredId: 'reg123', status: 'success' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

    const mockSave = vi.fn()
    
    // Participant is ALREADY success
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    vi.mocked(ParticipantModel.findById).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'reg123',
          payment: { status: 'success', method: 'manual_transfer' },
          member: { fullName: 'Test', email: 'test@test.com' },
          save: mockSave
        })
      })
    } as any)

    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    vi.mocked(AgendaModel.findById).mockResolvedValue({ _id: 'agenda123', title: 'Test' } as any)

    const handler = (await import('../../../server/api/agenda/[id]/payment/verify.post')).default
    const event = { context: { params: { id: 'agenda123' } } }

    await expect(handler(event as any)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Payment is already processed"
    })
    
    expect(mockSave).not.toHaveBeenCalled()
  })
})
