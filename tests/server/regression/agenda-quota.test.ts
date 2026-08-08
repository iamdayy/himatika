import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { ParticipantModel } from '../../../server/models/ParticipantModel'
import { AgendaModel } from '../../../server/models/AgendaModel'
import mongoose from 'mongoose'

describe('Agenda Quota Enforcement', async () => {
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

    await AgendaModel.create({
      _id: '60d5ecb8b392cb3a8c8e1113',
      title: 'Test Quota Agenda',
      date: { start: new Date(), end: new Date() },
      quota: 1 // Only 1 participant allowed
    })
  })

  it('should reject registration if quota is reached', async () => {
    const payload1 = {
      guest: {
        fullName: 'Test Guest 1',
        email: 'quota1@example.com',
        phone: '08123456781'
      }
    }
    const payload2 = {
      guest: {
        fullName: 'Test Guest 2',
        email: 'quota2@example.com',
        phone: '08123456782'
      }
    }

    // First registration should succeed
    const res1 = await $fetch('/api/agenda/60d5ecb8b392cb3a8c8e1113/participant/register', { method: 'POST', body: payload1 })
    expect(res1.statusCode).toBe(200)

    // Second registration should fail
    try {
      await $fetch('/api/agenda/60d5ecb8b392cb3a8c8e1113/participant/register', { method: 'POST', body: payload2 })
      // If it doesn't throw, the test should fail because quota is not enforced
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.statusCode).toBe(400) // or 403/409 depending on implementation
    }
  })
})
