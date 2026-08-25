/**
 * Unit tests for PUT /api/member/profile.
 *
 * Regression: the old endpoint wrote flat fields (village, district, ...)
 * that the Member schema stores nested under `address`/`birth` — strict
 * mode stripped them and the update was a silent no-op.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/models/MemberModel', () => ({
  MemberModel: { findByIdAndUpdate: vi.fn() }
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};

const updatedMember = {
  _id: 'm1',
  address: {
    village: 'Desa Maju',
    district: 'Kecamatan Jaya',
    city: 'Kota Baru',
    province: 'Provinsi Sejahtera',
    zip: '12345',
    fullAddress: 'Jalan Raya No 1',
  },
  birth: { place: 'Jalan Raya No 1' },
}

describe('Member Profile Update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const loadHandler = async () =>
    (await import('../../../server/api/member/profile.put')).default

  const makeEvent = () => ({
    context: { user: { member: { _id: 'm1', NIM: 999888777 } } },
  })

  it('maps flat payload to nested address/birth paths', async () => {
    const { MemberModel } = await import('../../../server/models/MemberModel')
    ;(MemberModel.findByIdAndUpdate as any).mockResolvedValue(updatedMember)

    const payload = {
      village: 'Desa Maju',
      district: 'Kecamatan Jaya',
      city: 'Kota Baru',
      province: 'Provinsi Sejahtera',
      zip: '12345',
      place: 'Jalan Raya No 1',
    }
    ;(globalThis as any).readBody.mockResolvedValue(payload)

    const handler = await loadHandler()
    const res = await handler(makeEvent() as any)

    expect(res.statusCode).toBe(200)
    expect(vi.mocked(MemberModel.findByIdAndUpdate)).toHaveBeenCalledWith(
      'm1',
      {
        $set: {
          'address.village': 'Desa Maju',
          'address.district': 'Kecamatan Jaya',
          'address.city': 'Kota Baru',
          'address.province': 'Provinsi Sejahtera',
          'address.zip': '12345',
          'birth.place': 'Jalan Raya No 1',
        },
      },
      { new: true }
    )
  })

  it('persists the update in the database (nested path)', async () => {
    const { MemberModel } = await import('../../../server/models/MemberModel')
    ;(MemberModel.findByIdAndUpdate as any).mockImplementation(
      async (_id: string, update: any) => {
        // Simulate strict-mode persistence at the documented paths only.
        expect(update.$set['address.village']).toBe('Desa Maju')
        return updatedMember
      }
    )

    ;(globalThis as any).readBody.mockResolvedValue({ village: 'Desa Maju' })

    const handler = await loadHandler()
    const res = await handler(makeEvent() as any)

    expect(res.statusCode).toBe(200)
    expect((res.data as any).address.village).toBe('Desa Maju')
  })

  it('rejects invalid payloads with 400', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ village: 123 })

    const handler = await loadHandler()
    await expect(handler(makeEvent() as any)).rejects.toMatchObject({
      statusCode: 400,
    })
  })
})
