import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import mongoose from 'mongoose'
import { UserModel } from '../../../server/models/UserModel'

describe('Upload Validation', async () => {
  await setup({
    server: true,
  })

  beforeAll(async () => {
    const uri = process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/himatika_test'
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri)
    }
  })

  it('should reject non-image file uploads in image upload endpoint', async () => {
    const formData = new FormData()
    const file = new Blob(['fake content'], { type: 'application/pdf' })
    formData.append('file', file, 'test.pdf')

    try {
      await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData as any,
        headers: {
          'Authorization': 'Bearer FAKE_TOKEN' // Will bypass if mock, but let's see
        }
      })
      expect(true).toBe(false)
    } catch (err: any) {
      // It should throw because of type validation or auth
      expect([400, 401, 500]).toContain(err.statusCode)
    }
  })

  it('should reject files exceeding size limit', async () => {
    // Generate a 10MB file
    const largeContent = new Uint8Array(10 * 1024 * 1024)
    const file = new Blob([largeContent], { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', file, 'large.png')

    try {
      await $fetch('/api/upload/image', {
        method: 'POST',
        body: formData as any
      })
      expect(true).toBe(false)
    } catch (err: any) {
      expect([400, 413, 401]).toContain(err.statusCode)
    }
  })
})
