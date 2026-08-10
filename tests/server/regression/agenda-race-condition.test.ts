import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { ParticipantModel } from '../../../server/models/ParticipantModel'
import { AgendaModel } from '../../../server/models/AgendaModel'
import { GuestModel } from '../../../server/models/GuestModel'
import mongoose from 'mongoose'

describe('Agenda Race Condition', async () => {
  await setup({
    server: true,
  })

  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }

    await ParticipantModel.deleteMany({})
    await AgendaModel.deleteMany({})
    await GuestModel.deleteMany({})

    await AgendaModel.create({
      _id: '60d5ecb8b392cb3a8c8e1112',
      title: 'Test Race Condition Agenda',
      date: { start: new Date(), end: new Date() },
    })
  })

  it('should not create multiple participant records on concurrent requests', async () => {
    const payload = {
      guest: {
        fullName: 'Test Guest',
        email: 'race@example.com',
        phone: '08123456789'
      }
    }

    // Send 3 concurrent requests
    const promises = [
      $fetch('/api/agenda/60d5ecb8b392cb3a8c8e1112/participant/register', { method: 'POST', body: payload }),
      $fetch('/api/agenda/60d5ecb8b392cb3a8c8e1112/participant/register', { method: 'POST', body: payload }),
      $fetch('/api/agenda/60d5ecb8b392cb3a8c8e1112/participant/register', { method: 'POST', body: payload })
    ]

    // Catch errors because subsequent ones SHOULD fail with 409
    const results = await Promise.allSettled(promises)

    // Count records in DB
    const participantCount = await ParticipantModel.countDocuments({ agendaId: '60d5ecb8b392cb3a8c8e1112' })
    const guestCount = await GuestModel.countDocuments({ email: 'race@example.com' })

    // Before fix, this will likely be > 1 because of the race condition
    expect(participantCount).toBe(1)
    expect(guestCount).toBe(1)
  })
})
