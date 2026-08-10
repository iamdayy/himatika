import mongoose from 'mongoose'
import { beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { UserModel } from '../../server/models/UserModel'
import { MemberModel } from '../../server/models/MemberModel'
import CategoryModel from '../../server/models/CategoryModel'
import { AgendaModel } from '../../server/models/AgendaModel'

beforeAll(async () => {
  const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  }

  // Wipe data
  await UserModel.deleteMany({})
  await MemberModel.deleteMany({})

  // Seed data
  const member = await MemberModel.create({
    NIM: 123456,
    fullName: 'Test Member',
    email: 'test@example.com'
  })
  
  await MemberModel.create({
    NIM: 654321,
    fullName: 'Test Unregistered Member',
    email: 'unregistered@example.com'
  })

  const hashedPassword = await bcrypt.hash('password123', 10)

  await UserModel.create({
    username: 'testuser',
    password: hashedPassword,
    member: member._id,
    verified: true
  })

  await CategoryModel.deleteMany({})
  await AgendaModel.deleteMany({})

  const category = await CategoryModel.create({
    title: 'Test Category',
    description: 'Category for testing',
    slug: 'test-category'
  })

  await AgendaModel.create({
    _id: '60d5ecb8b392cb3a8c8e1234', // Hardcoded ID for easy routing in test
    title: 'Test Paid Agenda',
    date: {
      start: new Date(Date.now() - 86400000), // yesterday
      end: new Date(Date.now() + 86400000) // tomorrow
    },
    category: category._id,
    at: 'Online',
    configuration: {
      participant: {
        pay: true,
        amount: 50000,
        canRegister: 'Public',
        canRegisterUntil: {
          start: new Date(Date.now() - 86400000),
          end: new Date(Date.now() + 86400000)
        }
      }
    }
  })
})

afterAll(async () => {
  await mongoose.disconnect()
})
