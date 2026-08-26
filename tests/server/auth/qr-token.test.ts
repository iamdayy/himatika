/**
 * Unit tests for signed ticket-QR payloads (v2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

;(globalThis as any).useRuntimeConfig = () => ({ jwtSecret: 'test-secret' })

describe('qrToken', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  const load = async () => await import('../../../server/utils/qrToken')

  it('signs and validates a v2 payload', async () => {
    const { signTicketQR, isTicketQRValidV2 } = await load()
    const id = '60d5ecb8b392cb3a8c8e2222'
    const signed = signTicketQR(id)

    expect(signed.startsWith(`${id}.`)).toBe(true)
    expect(isTicketQRValidV2(signed)).toBe(true)
  })

  it('rejects a tampered signature', async () => {
    const { signTicketQR, isTicketQRValidV2 } = await load()
    const id = '60d5ecb8b392cb3a8c8e2222'
    const signed = signTicketQR(id)
    const tampered = `${id}.${'A'.repeat(22)}`

    expect(isTicketQRValidV2(tampered)).toBe(false)
    // And a swapped-id attack: valid sig from another ticket must not match
    const other = signTicketQR('60d5ecb8b392cb3a8c8e9999')
    const stolenSig = other.split('.')[1]
    expect(isTicketQRValidV2(`${id}.${stolenSig}`)).toBe(false)
    expect(signed).not.toContain(stolenSig)
  })

  it('returns null (not v2) for legacy payloads', async () => {
    const { isTicketQRValidV2 } = await load()
    expect(isTicketQRValidV2('60d5ecb8b392cb3a8c8e2222')).toBeNull()
    expect(
      isTicketQRValidV2(JSON.stringify({ a: '60d5ecb8b392cb3a8c8e1111', p: '60d5ecb8b392cb3a8c8e2222', t: 'p' }))
    ).toBeNull()
    expect(isTicketQRValidV2('https://himatika.org/verify/ticket/60d5ecb8b392cb3a8c8e2222')).toBeNull()
  })

  it('produces deterministic signatures bound to the secret', async () => {
    const { signTicketQR } = await load()
    const id = '60d5ecb8b392cb3a8c8e2222'
    const expected = crypto
      .createHmac('sha256', 'test-secret')
      .update(id)
      .digest('base64url')
      .slice(0, 22)
    expect(signTicketQR(id)).toBe(`${id}.${expected}`)
  })
})
