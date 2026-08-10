import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { ParticipantModel } from '../../../server/models/ParticipantModel'
import { AgendaModel } from '../../../server/models/AgendaModel'
import mongoose from 'mongoose'

describe('Payment Webhook (Midtrans)', async () => {
  await setup({
    server: true,
  })

  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }

    // Clean and seed
    await ParticipantModel.deleteMany({})
    await AgendaModel.deleteMany({})

    const agenda = await AgendaModel.create({
      title: 'Test Webhook Agenda',
      date: { start: new Date(), end: new Date() },
    })

    await ParticipantModel.create({
      _id: '60d5ecb8b392cb3a8c8e1111',
      agendaId: agenda._id,
      payment: {
        method: 'midtrans',
        status: 'pending',
        time: Date.now()
      }
    })
  })

  it('should mark payment as canceled when status is 202 and expire', async () => {
    // Generate signature key: sha512(order_id + status_code + gross_amount + ServerKey)
    // Actually the mock verifySignature needs to pass. 
    // verifySignature uses crypto.createHash('sha512').update(order_id + status_code + gross_amount + serverKey).digest('hex')
    // We don't have MIDTRANS_SERVER_KEY in test environment, but maybe it's undefined/empty.
    // So let's mock it or provide a valid signature based on empty key.
    const order_id = '60d5ecb8b392cb3a8c8e1111:12345'
    const status_code = '202'
    const gross_amount = '50000.00'
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    
    // We can't easily import crypto here without node. 
    const crypto = await import('crypto')
    const signature_key = crypto.createHash('sha512').update(order_id + status_code + gross_amount + serverKey).digest('hex')

    const res = await $fetch('/api/payment/notification', {
      method: 'POST',
      body: {
        order_id,
        status_code,
        transaction_status: 'expire',
        fraud_status: 'accept',
        gross_amount,
        signature_key
      }
    })

    expect(res.statusCode).toBe(200)

    const participant = await ParticipantModel.findById('60d5ecb8b392cb3a8c8e1111')
    expect(participant).toBeDefined()
    expect(participant?.payment?.status).toBe('canceled') // This should fail before fix, because 202 bypasses the handler
  })
})
