/**
 * Test: Agenda Quota Enforcement
 *
 * Regression: the old code checked `agenda.quota` — a field that never
 * existed on the schema, so strict mode made it undefined and capacity
 * was NEVER enforced. The fix adds quota/seatsTaken to the schema and
 * reserves seats atomically ($expr + $inc) with lazy counter init and
 * release-on-failure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: {
    findById: vi.fn(),
    updateOne: vi.fn(),
  }
}))
vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: {
    countDocuments: vi.fn(),
    exists: vi.fn(),
    findOneAndUpdate: vi.fn(),
  }
}))
vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: {
    exists: vi.fn(),
  }
}))
vi.mock('../../../server/models/GuestModel', () => ({
  GuestModel: {
    findOne: vi.fn(),
    create: vi.fn(),
  }
}))
vi.mock('../../../server/models/MemberModel', () => ({
  MemberModel: {
    findOne: vi.fn(),
  }
}))
vi.mock('../../../server/utils/mailTemplate', () => ({
  default: class Email {
    constructor(_mail: unknown) {}
    render() { return '<html/>' }
  },
}))
vi.mock('../../../server/utils/qrcode', () => ({
  generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,x'),
}))
vi.mock('@upstash/qstash', () => ({
  Client: class {
    publishJSON = vi.fn().mockResolvedValue({})
  },
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};
;(globalThis as any).useRuntimeConfig = () => ({
  public: { public_uri: 'http://localhost:3000' },
});

const guestPayload = (n: number) => ({
  guest: {
    fullName: `Test Guest ${n}`,
    email: `quota${n}@example.com`,
    phone: `0812345678${n}`,
  },
})

describe('Agenda Quota Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeAgenda = (overrides: Record<string, unknown> = {}) => ({
    _id: '60d5ecb8b392cb3a8c8e1113',
    title: 'Test Quota Agenda',
    quota: 1,
    seatsTaken: null,
    ...overrides,
  })

  const loadHandler = async () =>
    (await import('../../../server/api/agenda/[id]/participant/register/index.post')).default

  it('reserves a seat atomically when quota is available', async () => {
    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    const { GuestModel } = await import('../../../server/models/GuestModel')

    vi.mocked((globalThis as any).readBody).mockResolvedValue(guestPayload(1))
    vi.mocked(AgendaModel.findById).mockResolvedValue(makeAgenda() as any)
    // First updateOne = lazy counter init; second = reservation succeeds.
    vi.mocked(AgendaModel.updateOne)
      .mockResolvedValueOnce({ acknowledged: true } as any)
      .mockResolvedValueOnce({ modifiedCount: 1 } as any)
    vi.mocked(ParticipantModel.countDocuments).mockResolvedValue(0 as any)
    vi.mocked(ParticipantModel.exists).mockResolvedValue(null as any)
    vi.mocked(ParticipantModel.findOneAndUpdate).mockResolvedValue(null as any)
    vi.mocked(GuestModel.findOne).mockResolvedValue(null as any)
    vi.mocked(GuestModel.create).mockResolvedValue({ _id: 'guest1' } as any)

    const handler = await loadHandler()
    const response = await handler({
      context: { params: { id: '60d5ecb8b392cb3a8c8e1113' }, user: null },
    } as any)

    expect(response.statusCode).toBe(200)

    // Reservation must be atomic: conditional on seatsTaken < quota.
    expect(vi.mocked(AgendaModel.updateOne)).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: '60d5ecb8b392cb3a8c8e1113',
        $expr: { $lt: ['$seatsTaken', '$quota'] },
      }),
      { $inc: { seatsTaken: 1 } }
    )
  })

  it('rejects with 400 and never inserts when quota is full', async () => {
    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')

    vi.mocked((globalThis as any).readBody).mockResolvedValue(guestPayload(2))
    vi.mocked(AgendaModel.findById).mockResolvedValue(makeAgenda() as any)
    // Counter already initialized; reservation finds no free seat.
    vi.mocked(AgendaModel.updateOne).mockResolvedValue({ modifiedCount: 0 } as any)
    vi.mocked(ParticipantModel.countDocuments).mockResolvedValue(1 as any)

    const handler = await loadHandler()
    const event = { context: { params: { id: '60d5ecb8b392cb3a8c8e1113' }, user: null } }

    await expect(handler(event as any)).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(vi.mocked(ParticipantModel.findOneAndUpdate)).not.toHaveBeenCalled()
  })

  it('releases the reserved seat if registration fails afterwards', async () => {
    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    const { GuestModel } = await import('../../../server/models/GuestModel')

    vi.mocked((globalThis as any).readBody).mockResolvedValue(guestPayload(3))
    vi.mocked(AgendaModel.findById).mockResolvedValue(makeAgenda() as any)
    vi.mocked(AgendaModel.updateOne)
      .mockResolvedValueOnce({ acknowledged: true } as any)   // init
      .mockResolvedValueOnce({ modifiedCount: 1 } as any)     // reserve
      .mockResolvedValue({ modifiedCount: 1 } as any)         // release
    vi.mocked(ParticipantModel.countDocuments).mockResolvedValue(0 as any)
    vi.mocked(ParticipantModel.exists).mockResolvedValue(null as any)
    // Upsert detects an existing record -> handler must abort AND release.
    vi.mocked(ParticipantModel.findOneAndUpdate).mockResolvedValue({ _id: 'existing' } as any)
    vi.mocked(GuestModel.findOne).mockResolvedValue(null as any)
    vi.mocked(GuestModel.create).mockResolvedValue({ _id: 'guest3' } as any)

    const handler = await loadHandler()
    const event = { context: { params: { id: '60d5ecb8b392cb3a8c8e1113' }, user: null } }

    await expect(handler(event as any)).rejects.toMatchObject({ statusCode: 409 })

    expect(vi.mocked(AgendaModel.updateOne)).toHaveBeenCalledWith(
      { _id: '60d5ecb8b392cb3a8c8e1113', seatsTaken: { $gt: 0 } },
      { $inc: { seatsTaken: -1 } }
    )
  })
})
