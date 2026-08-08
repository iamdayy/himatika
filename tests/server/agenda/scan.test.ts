/**
 * Regression Test: QR Scan Handler
 * 
 * Bug: `scan.post.ts` used to parse `code` from request body via `JSON.parse`
 * without try-catch. Malformed JSON caused 500 Server Error.
 * 
 * This test verifies the handler gracefully returns 400 Bad Request
 * when given malformed QR JSON.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks ---

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: { findById: vi.fn() }
}))
vi.mock('../../../server/utils/agendaAuth', () => ({
  ensureCommitteeOrOrganizer: vi.fn()
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).getRouterParam = vi.fn();
;(globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
}

describe('Agenda QR Scan Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 Bad Request when QR code is not valid JSON', async () => {
    // Malformed JSON (missing quotes)
    const payload = { code: '{ id: 123, role: Participant }' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)
    vi.mocked((globalThis as any).getRouterParam).mockReturnValue('agenda123')

    const handler = (await import('../../../server/api/agenda/[id]/scan.post')).default
    
    // The handler should throw a Nuxt Error with statusCode 400
    await expect(handler({ context: { user: { _id: 'u1' } } } as any)).rejects.toMatchObject({
      statusCode: 400,
      message: "QR Code tidak valid (format JSON salah)"
    })
  })
  
  it('should return 400 Bad Request when QR code is missing required fields', async () => {
    // Valid JSON but missing 'role'
    const payload = { code: '{"id":"123"}' }
    vi.mocked((globalThis as any).readBody).mockResolvedValue(payload)
    vi.mocked((globalThis as any).getRouterParam).mockReturnValue('agenda123')

    const handler = (await import('../../../server/api/agenda/[id]/scan.post')).default
    
    await expect(handler({ context: { user: { _id: 'u1' } } } as any)).rejects.toMatchObject({
      statusCode: 400,
      message: "QR Code tidak valid"
    })
  })
})
