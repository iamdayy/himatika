import { describe, it, expect } from 'vitest'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

describe('Basic E2E tests', async () => {
  await setup({
    server: true,
    browser: true,
  })

  it('displays the homepage correctly', async () => {
    // We can use $fetch to check if the route returns HTML
    const html = await $fetch('/')
    expect(html).toContain('HIMATIKA') // Assuming this text is on the homepage
  })

  it('has a login page', async () => {
    const page = await createPage('/login')
    const text = await page.textContent('body')
    expect(text).toContain('Login')
    expect(text).toContain('NIM')
  })
})
