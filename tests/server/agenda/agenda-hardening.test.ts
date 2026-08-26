/**
 * Smoke tests for the agenda hardening pass: PDF-worker URL normalization
 * and the DB-backed /api/agenda/ticket/make contract.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../server/models/AgendaModel', () => ({
  AgendaModel: { findById: vi.fn() }
}))
vi.mock('../../../server/models/ParticipantModel', () => ({
  ParticipantModel: {
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
  }
}))
vi.mock('../../../server/models/CommitteeModel', () => ({
  CommitteeModel: { findById: vi.fn(), findOneAndUpdate: vi.fn() }
}))

;(globalThis as any).defineEventHandler = (fn: Function) => fn;
;(globalThis as any).readBody = vi.fn();
;(globalThis as any).createError = (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage) as Error & { statusCode?: number, statusMessage?: string }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
};
;(globalThis as any).setResponseHeaders = vi.fn();

describe('PDF worker base URL normalization', () => {
  // No module reset needed: getWorkerBaseUrl reads runtimeConfig at call time.
  beforeEach(() => {
    ;(globalThis as any).useRuntimeConfig = () => ({ pdf_worker_api_url: undefined })
  })

  const load = async () =>
    (await import('../../../server/utils/himatikaPdfWorker')).getWorkerBaseUrl

  it('strips trailing /api so call sites can append it explicitly', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({
      pdf_worker_api_url: 'https://worker.example.com/api',
    })
    const getBase = await load()
    expect(getBase()).toBe('https://worker.example.com')
  })

  it('handles trailing slashes and bare hosts', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({
      pdf_worker_api_url: 'http://localhost:8081/api/',
    })
    const getBase = await load()
    expect(getBase()).toBe('http://localhost:8081')

    ;(globalThis as any).useRuntimeConfig = () => ({
      pdf_worker_api_url: 'https://worker.example.com',
    })
    const getBaseBare = await load()
    expect(getBaseBare()).toBe('https://worker.example.com')
  })
})

// The handler chains .populate(); self-returning thenable works for any count.
const queryStub = (resolved: unknown) => {
  const stub: any = { populate: vi.fn(() => stub) }
  stub.then = (onFulfilled?: (v: unknown) => unknown) =>
    Promise.resolve(resolved).then(onFulfilled)
  return stub
}

describe('POST /api/agenda/ticket/make', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).useRuntimeConfig = () => ({
      public: { public_uri: 'http://localhost:3000' },
      jwtSecret: 'test-secret',
      pdf_worker_api_url: 'https://worker.example.com/api',
    })
  })

  const loadHandler = async () =>
    (await import('../../../server/api/agenda/ticket/make.post')).default

  it('rejects requests missing ids', async () => {
    ;(globalThis as any).readBody.mockResolvedValue({ role: 'participant' })
    const handler = await loadHandler()
    await expect(handler({ context: { user: { member: {} } } } as any)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('404s when the registration does not belong to the agenda', async () => {
    const { AgendaModel } = await import('../../../server/models/AgendaModel')
    const { ParticipantModel } = await import('../../../server/models/ParticipantModel')
    ;(globalThis as any).readBody.mockResolvedValue({
      id: '60d5ecb8b392cb3a8c8e1113',
      registeredId: '60d5ecb8b392cb3a8c8e2222',
      role: 'participant',
    })
    vi.mocked(AgendaModel.findById).mockResolvedValue({
      _id: '60d5ecb8b392cb3a8c8e1113',
      configuration: {},
    } as any)
    vi.mocked(ParticipantModel.findById).mockReturnValue(
      queryStub({ _id: '60d5ecb8b392cb3a8c8e2222', agendaId: 'OTHER' }) as any
    )

    const handler = await loadHandler()
    await expect(
      handler({ context: { user: { member: { NIM: 123 } } } } as any)
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})
