import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'

describe('E2E Login', async () => {
  await setup({
    server: true,
    browser: true,
  })

  it('fails with wrong password', async () => {
    const page = await createPage('/login')
    await page.waitForSelector('input[name="username"]')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Tunggu sampai pesan error toast muncul
    await page.waitForSelector('text=salah', { timeout: 5000 }).catch(() => {})
    const text = await page.textContent('body')
    expect(text).toContain('salah')
  })

  it('succeeds with correct credentials', async () => {
    const page = await createPage('/login')
    await page.waitForSelector('input[name="username"]')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Should redirect to /profile
    await page.waitForURL('**/profile', { timeout: 5000 })
    expect(page.url()).toContain('/profile')
  })
})
