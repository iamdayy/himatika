import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { MemberModel } from '../../../server/models/MemberModel'
import { UserModel } from '../../../server/models/UserModel'
import { PointModel } from '../../../server/models/PointModel'
import { BadgeModel } from '../../../server/models/BadgeModel'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

describe('Member Badge Gamification', async () => {
  await setup({
    server: true,
  })

  let authToken = ''
  let memberId = ''
  let badgeId = ''

  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }

    await MemberModel.deleteMany({ NIM: 999888778 })
    await UserModel.deleteMany({ NIM: 999888778 })
    await PointModel.deleteMany({ reason: 'Test Badge Point' })
    await BadgeModel.deleteMany({ slug: 'test-badge' })

    const badge = await BadgeModel.create({
      name: 'Test Badge',
      description: 'For 100 points',
      icon: 'star',
      slug: 'test-badge',
      minPoints: 100
    })
    badgeId = badge._id.toString()

    const member = await MemberModel.create({
      NIM: 999888778,
      fullName: 'Test Gamification Member',
      badges: []
    })
    memberId = member._id.toString()

    const user = await UserModel.create({
      NIM: 999888778,
      email: 'gamify@example.com',
      password: 'password',
      member: member._id,
      verified: true
    })

    const config = useRuntimeConfig()
    authToken = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '1h' })
  })

  it('should not evaluate any badge if points are below minPoints', async () => {
    await PointModel.create({
      member: memberId,
      amount: 50,
      reason: 'Test Badge Point',
      status: 'approved'
    })

    const res = await $fetch('/api/member/badge/evaluate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.data.totalPoints).toBe(50)
    expect(res.data.newBadgesAdded).toBe(false)
    expect(res.data.badges).toHaveLength(0)
  })

  it('should evaluate and assign badge if points exceed minPoints', async () => {
    // Add 60 more points (Total = 110)
    await PointModel.create({
      member: memberId,
      amount: 60,
      reason: 'Test Badge Point',
      status: 'approved'
    })

    const res = await $fetch('/api/member/badge/evaluate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })

    expect(res.statusCode).toBe(200)
    expect(res.data.totalPoints).toBe(110)
    expect(res.data.newBadgesAdded).toBe(true)
    expect(res.data.badges).toContain(badgeId)

    // Verify DB
    const member = await MemberModel.findById(memberId)
    expect(member?.badges).toHaveLength(1)
    expect(member?.badges[0].toString()).toBe(badgeId)
  })
})
