/**
 * Regression Test: Midtrans Notification Handler
 * 
 * Bug: notification.post.ts wraps ALL logic (including cancel/deny/expire branch)
 * inside `if (status_code === "200")`. Midtrans sends status_code "202" for 
 * expire/deny/cancel notifications, so those branches never execute.
 * 
 * These tests verify the handler correctly processes notifications for ALL status codes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// --- Mocks ---

// Mock Mongoose models
const mockParticipantFindById = vi.fn()
const mockParticipantUpdateOne = vi.fn()
const mockParticipantFindOne = vi.fn()
const mockParticipantDeleteOne = vi.fn()
const mockParticipantCountDocuments = vi.fn()
const mockCommitteeFindById = vi.fn()
const mockCommitteeUpdateOne = vi.fn()
const mockAgendaFindById = vi.fn()

vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: {
    findById: (...args: unknown[]) => mockParticipantFindById(...args),
    updateOne: (...args: unknown[]) => mockParticipantUpdateOne(...args),
    findOne: (...args: unknown[]) => mockParticipantFindOne(...args),
    deleteOne: (...args: unknown[]) => mockParticipantDeleteOne(...args),
    countDocuments: (...args: unknown[]) => mockParticipantCountDocuments(...args),
  }
}))

vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: {
    findById: (...args: unknown[]) => mockCommitteeFindById(...args),
    updateOne: (...args: unknown[]) => mockCommitteeUpdateOne(...args),
  }
}))

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: {
    findById: (...args: unknown[]) => mockAgendaFindById(...args),
    updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  }
}))

vi.mock('../../../server/utils/himatikaPdfWorker', () => ({
  himatikaPdfWorker: { generateTicket: vi.fn() }
}))

vi.mock('../../../server/utils/whatsapp', () => ({
  sendWhatsappFile: vi.fn()
}))

// Mock Nuxt auto-imports
;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode: number; statusMessage: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({
  jwtSecret: 'test-secret',
  midtrans_server_key: 'test-server-key',
  public: { public_uri: 'http://localhost:3000' }
});

// Helper: generate valid Midtrans signature
function generateSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')
}

function createNotificationPayload(overrides: Partial<{
  order_id: string;
  status_code: string;
  transaction_status: string;
  fraud_status: string;
  gross_amount: string;
}> = {}) {
  const orderId = overrides.order_id || 'reg123:abc'
  const statusCode = overrides.status_code || '200'
  const grossAmount = overrides.gross_amount || '50000'
  const serverKey = 'test-server-key'

  return {
    order_id: orderId,
    status_code: statusCode,
    transaction_status: overrides.transaction_status || 'settlement',
    fraud_status: overrides.fraud_status || 'accept',
    payment_type: 'bank_transfer',
    transaction_time: '2024-01-01 12:00:00',
    transaction_id: 'tx-123',
    status_message: 'Success',
    gross_amount: grossAmount,
    signature_key: generateSignature(orderId, statusCode, grossAmount, serverKey),
  }
}

describe('Midtrans Notification Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BUG REGRESSION: status_code "202" notifications', () => {
    it('should process "expire" notification with status_code "202" and mark payment as canceled', async () => {
      const payload = createNotificationPayload({
        status_code: '202',
        transaction_status: 'expire',
      })

      const { readBody: mockReadBody } = await import('h3') as unknown as { readBody: ReturnType<typeof vi.fn> }
      vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

      // Mock: participant exists with pending payment
      mockCommitteeUpdateOne.mockResolvedValue({ matchedCount: 0 })
      mockParticipantFindById.mockResolvedValue({
        _id: 'reg123',
        payment: { status: 'pending', method: 'bank_transfer' },
        member: { _id: 'member1' },
        guest: null,
      })
      mockParticipantUpdateOne.mockResolvedValue({ modifiedCount: 1 })

      // Import the handler
      const handler = (await import('../../../server/api/payment/notification.post')).default
      const result = await handler({} as any)

      // ASSERTION: The expire notification MUST trigger payment update
      // With the bug, this will NOT be called because status_code "202" skips all logic
      expect(mockParticipantUpdateOne).toHaveBeenCalledWith(
        { _id: 'reg123', 'payment.status': { $ne: 'success' } },
        expect.objectContaining({
          'payment.status': 'canceled',
        })
      )
    })

    it('should process "deny" notification with status_code "202" and mark payment as canceled', async () => {
      const payload = createNotificationPayload({
        status_code: '202',
        transaction_status: 'deny',
      })

      vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

      mockCommitteeUpdateOne.mockResolvedValue({ matchedCount: 0 })
      mockParticipantFindById.mockResolvedValue({
        _id: 'reg123',
        payment: { status: 'pending', method: 'bank_transfer' },
        member: { _id: 'member1' },
        guest: null,
      })
      mockParticipantUpdateOne.mockResolvedValue({ modifiedCount: 1 })

      const handler = (await import('../../../server/api/payment/notification.post')).default
      const result = await handler({} as any)

      expect(mockParticipantUpdateOne).toHaveBeenCalledWith(
        { _id: 'reg123', 'payment.status': { $ne: 'success' } },
        expect.objectContaining({
          'payment.status': 'canceled',
        })
      )
    })

    it('must NOT downgrade or delete an already-paid registration on a late failure notification', async () => {
      const payload = createNotificationPayload({
        status_code: '202',
        transaction_status: 'expire',
      })
      vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

      // Atomic guard blocks the committee update (status already "success"),
      // then the participant lookup confirms the paid state.
      mockCommitteeUpdateOne.mockResolvedValue({ matchedCount: 0 })
      mockParticipantFindById.mockResolvedValue({
        _id: 'reg123',
        payment: { status: 'success', method: 'bank_transfer' },
        member: { _id: 'member1' },
        guest: null,
      })

      const handler = (await import('../../../server/api/payment/notification.post')).default
      const result = await handler({} as any)

      expect(result.statusCode).toBe(200)
      expect(String(result.statusMessage)).toContain('terbayar')
      expect(mockParticipantDeleteOne).not.toHaveBeenCalled()
      expect(mockParticipantUpdateOne).not.toHaveBeenCalled()
      expect(mockParticipantCountDocuments).not.toHaveBeenCalled()
    })
  })

  describe('Normal flow: status_code "200" settlement', () => {
    it('should process "settlement" notification and mark payment as success', async () => {
      const payload = createNotificationPayload({
        status_code: '200',
        transaction_status: 'settlement',
        fraud_status: 'accept',
      })

      vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)

      // Mock: committee found
      mockCommitteeFindById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: 'reg123',
            payment: { status: 'pending' },
            member: { fullName: 'Test', email: 'test@test.com', phone: '08123' },
          })
        })
      })
      mockCommitteeUpdateOne.mockResolvedValue({ modifiedCount: 1 })
      mockAgendaFindById.mockResolvedValue(null) // Skip ticket generation

      const handler = (await import('../../../server/api/payment/notification.post')).default
      const result = await handler({} as any)

      expect(mockCommitteeUpdateOne).toHaveBeenCalledWith(
        { _id: 'reg123' },
        expect.objectContaining({
          'payment.status': 'success',
        })
      )
    })
  })
})
