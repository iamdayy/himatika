import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils/e2e'

describe('E2E Registration', async () => {
  await setup({
    server: true,
    browser: true,
  })

  it('fails with invalid or non-existent NIM', async () => {
    const page = await createPage('/register')
    await page.waitForSelector('input[name="NIM"]')
    await page.fill('input[name="NIM"]', '999999')
    // Click next button
    await page.click('button:has-text("Next"), button:has-text("Selanjutnya"), button:has-text("Lanjut")')
    
    // Tunggu sampai pesan error muncul
    await page.waitForSelector('text=tidak ditemukan', { timeout: 5000 }).catch(() => {})
    const text = await page.textContent('body')
    expect(text).toContain('tidak ditemukan')
  })

  it('succeeds with valid unregistered NIM and proceeds to account creation', async () => {
    const page = await createPage('/register')
    await page.waitForSelector('input[name="NIM"]')
    await page.fill('input[name="NIM"]', '654321')
    await page.click('button:has-text("Next"), button:has-text("Selanjutnya"), button:has-text("Lanjut")')
    
    // Tunggu sampai pindah ke step selanjutnya (ada form input username/email)
    await page.waitForSelector('input[name="username"]', { timeout: 5000 })
    await page.fill('input[name="username"]', 'newuser')
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'Password123')
    await page.fill('input[name="password_confirmation"]', 'Password123')
    
    // Submit registration form
    await page.click('button:has-text("Next"), button:has-text("Selanjutnya"), button:has-text("Lanjut")')
    
    // Step selanjutnya (OTP atau Berhasil)
    await page.waitForSelector('text=berhasil', { timeout: 10000 }).catch(() => {})
    const text = await page.textContent('body')
    expect(text).toContain('berhasil')
  })
})
