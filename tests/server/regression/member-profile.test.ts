import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { MemberModel } from '../../../server/models/MemberModel'
import { UserModel } from '../../../server/models/UserModel'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

describe('Member Profile Address Feature', async () => {
  await setup({
    server: true,
  })

  let authToken = ''
  let memberId = ''

  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }

    await MemberModel.deleteMany({ NIM: 999888777 })
    await UserModel.deleteMany({ NIM: 999888777 })

    const member = await MemberModel.create({
      NIM: 999888777,
      fullName: 'Test Profile Member',
    })
    memberId = member._id.toString()

    const user = await UserModel.create({
      NIM: 999888777,
      email: 'profile@example.com',
      password: 'password',
      member: member._id,
      verified: true
    })

    const config = useRuntimeConfig()
    authToken = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' })
  })

  it('should update member address fields', async () => {
    const payload = {
      village: 'Desa Maju',
      district: 'Kecamatan Jaya',
      city: 'Kota Baru',
      province: 'Provinsi Sejahtera',
      zip: '12345',
      place: 'Jalan Raya No 1'
    }

    const res = await $fetch('/api/member/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: payload
    })

    expect(res.statusCode).toBe(200)
    expect(res.data.village).toBe('Desa Maju')
    expect(res.data.province).toBe('Provinsi Sejahtera')

    // Verify DB
    const member = await MemberModel.findById(memberId)
    expect(member?.village).toBe('Desa Maju')
  })

  it('should reject invalid payloads', async () => {
    try {
      await $fetch('/api/member/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          village: 123 // Should be string
        }
      })
      expect(true).toBe(false)
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })
})
