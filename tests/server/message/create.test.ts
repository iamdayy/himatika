/**
 * Unit tests for POST /api/message (public contact form).
 *
 * The handler must validate the body with Zod and only pass known fields
 * to the model — never the raw request body.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMessageCreate = vi.fn()

vi.mock('../../../server/models/MessageModel', () => ({
  MessageModel: {
    create: (...args: unknown[]) => mockMessageCreate(...args),
  },
}))

// Mock Nuxt auto-imports
;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string; data?: unknown }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number; statusMessage?: string; data?: unknown }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  err.data = opts.data
  return err
};

const validBody = () => ({
  name: { first: 'Budi', last: 'Santoso' },
  email: 'budi@example.com',
  phone: '08123456789',
  subject: 'Halo',
  message: 'Pesan tes',
  tags: ['saran'],
})

describe('POST /api/message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a message from a valid body', async () => {
    const { readBody } = globalThis as any
    readBody.mockResolvedValue(validBody())
    mockMessageCreate.mockResolvedValue({ _id: 'm1' })

    const handler = (await import('../../../server/api/message/index.post')).default
    const result = await handler({} as any)

    expect(result).toMatchObject({ statusCode: 200 })
    expect(mockMessageCreate).toHaveBeenCalledWith({
      name: { first: 'Budi', last: 'Santoso' },
      email: 'budi@example.com',
      phone: '08123456789',
      subject: 'Halo',
      message: 'Pesan tes',
      tags: ['saran'],
    })
  })

  it('rejects an invalid body with 400 without touching the DB', async () => {
    const { readBody } = globalThis as any
    readBody.mockResolvedValue({ ...validBody(), email: 'bukan-email' })

    const handler = (await import('../../../server/api/message/index.post')).default
    await expect(handler({} as any)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockMessageCreate).not.toHaveBeenCalled()
  })

  it('strips privileged fields instead of passing the raw body', async () => {
    const { readBody } = globalThis as any
    readBody.mockResolvedValue({ ...validBody(), archived: true })
    mockMessageCreate.mockResolvedValue({ _id: 'm1' })

    const handler = (await import('../../../server/api/message/index.post')).default
    const result = await handler({} as any)

    expect(result).toMatchObject({ statusCode: 200 })
    const createdArg = mockMessageCreate.mock.calls[0][0] as Record<string, unknown>
    expect(createdArg).not.toHaveProperty('archived')
  })
})
