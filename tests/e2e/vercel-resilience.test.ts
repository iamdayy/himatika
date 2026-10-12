/**
 * Vercel-like resilience tests for the auth refresh flow.
 *
 * Simulates production failure modes that rarely happen locally but are
 * routine on Vercel Free (cold starts, slow first responses, concurrent
 * tabs racing a rotation) entirely through request interception — no
 * server or database restarts needed:
 *
 * 1. A transient 500 on /api/refresh must be retried, NOT treated as a
 *    logout (cold-start behaviour).
 * 2. Two tabs refreshing concurrently with the same token must both
 *    succeed without mass-revoking the session (rotation race).
 * 3. Negative control: a genuine 401 from /api/refresh must still log
 *    the user out (no regression into "never logs out").
 *
 * Interception design note: /dashboard fetches /api/config twice on mount
 * — once via the layout Footer's plain useFetch (no refresh logic) and once
 * via the page's $api (the code under test), in either order. Interceptions
 * therefore fail the first TWO calls then pass, and assertions count
 * refresh hits so a test can never pass vacuously when the plugin path
 * was never engaged.
 */
import { describe, it, expect } from 'vitest'
import { setup, createPage, getBrowser, url } from '@nuxt/test-utils/e2e'
import type { BrowserContext, Page } from 'playwright-core'
import { SessionModel } from '../../server/models/SessionModel'

describe('Vercel resilience (auth refresh)', async () => {
  // Set E2E_HEADED=1 to watch the tests drive a visible browser
  // (uses the system display, e.g. WSLg) with slow motion.
  const headed = process.env.E2E_HEADED === '1'
  // Set E2E_SHOTS=1 to save milestone screenshots to test-results/
  // (watchable PNGs, no display needed).
  const shotsDir = process.env.E2E_SHOTS === '1' ? 'test-results/e2e-shots' : undefined
  const shot = async (page: Page, name: string): Promise<void> => {
    if (shotsDir) await page.screenshot({ path: `${shotsDir}/${name}.png`, fullPage: true })
  }
  await setup({
    server: true,
    browser: true,
    browserOptions: {
      type: 'chromium',
      launch: headed ? { headless: false, slowMo: 700 } : {},
    },
  })

  const gotoReady = async (page: Page, path: string): Promise<void> => {
    // Plain pages lack createPage's hydration-waiting goto wrapper.
    await page.goto(url(path))
    await page.waitForFunction(
      () => (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.().isHydrating === false,
      undefined,
      { timeout: 30000 }
    )
  }

  const loginOn = async (page: Page): Promise<void> => {
    await gotoReady(page, '/login')
    await page.waitForSelector('input[name="username"]')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'password123')
    // The first-visit onboarding tour overlay covers the submit button and
    // steals focus, so submit the form natively instead of clicking/typing.
    await page.evaluate(() => {
      document.getElementById('signin')?.closest('form')?.requestSubmit()
    })
    await page.waitForURL('**/profile', { timeout: 30000 })
  }

  const login = async (): Promise<{ page: Page; cleanup: () => Promise<void> }> => {
    const page = await createPage('/login')
    await loginOn(page)
    return { page, cleanup: () => page.close() }
  }

  /**
   * Fail the first `failTimes` matching requests with `status`, pass the
   * rest through. `hits` counts every matching request so tests can prove
   * the exercised path was actually hit.
   */
  const intercept = (
    page: Page,
    predicate: (url: URL) => boolean,
    behavior: { failTimes: number; status: number; hits?: { count: number } }
  ): void => {
    let n = 0
    page.route(predicate, async (route) => {
      n += 1
      if (behavior.hits) behavior.hits.count += 1
      if (n <= behavior.failTimes) {
        await route.fulfill({
          status: behavior.status,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: behavior.status }),
        })
      } else {
        await route.continue()
      }
    })
  }

  const isConfigCall = (url: URL): boolean => url.pathname === '/api/config'
  const isRefreshCall = (url: URL): boolean => url.pathname === '/api/refresh'

  const dashboardSettled = async (page: Page): Promise<void> => {
    await gotoReady(page, '/dashboard')
    // Rendered only after the $api('/api/config') + stats calls resolve.
    await page.waitForSelector('#card-point', { timeout: 30000 })
    expect(page.url()).toContain('/dashboard')
  }

  it(
    'survives a transient 500 on /api/refresh without logging out',
    { timeout: 120_000 },
    async () => {
      const { page, cleanup } = await login()
      const refreshHits = { count: 0 }

      // Cold start: data calls 401 (expired token), then the refresh
      // itself 500s once (slow instance) before recovering.
      intercept(page, isConfigCall, { failTimes: 2, status: 401 })
      intercept(page, isRefreshCall, { failTimes: 1, status: 500, hits: refreshHits })

      await dashboardSettled(page)

      // The transient 500 was actually retried through (non-vacuous) and
      // the user is still authenticated: fresh cookies, no /login bounce.
      expect(refreshHits.count).toBeGreaterThanOrEqual(2)
      const cookies = await page.context().cookies()
      expect(cookies.some((c) => c.name === 'auth.token' && c.value)).toBe(true)
      expect(page.url()).not.toContain('/login')
      await shot(page, 't1-dashboard')
      await cleanup()
    }
  )

  it(
    'two tabs refreshing concurrently both stay logged in',
    { timeout: 120_000 },
    async () => {
      // One shared context = one cookie jar = both tabs refresh with the
      // same refresh token, like two real tabs. (createPage isolates
      // contexts, so build the tabs manually here.)
      const browser = await getBrowser()
      const context: BrowserContext = await browser.newContext()
      const pageA = await context.newPage()
      const pageB = await context.newPage()
      await loginOn(pageA)
      const sessionsBefore = await SessionModel.countDocuments()
      const refreshHitsA = { count: 0 }
      const refreshHitsB = { count: 0 }

      intercept(pageA, isConfigCall, { failTimes: 2, status: 401 })
      intercept(pageB, isConfigCall, { failTimes: 2, status: 401 })
      intercept(pageA, isRefreshCall, { failTimes: 0, status: 500, hits: refreshHitsA })
      intercept(pageB, isRefreshCall, { failTimes: 0, status: 500, hits: refreshHitsB })

      await Promise.all([dashboardSettled(pageA), dashboardSettled(pageB)])

      // Both tabs actually refreshed, and no mass revocation happened:
      // rotation occurred in place.
      expect(refreshHitsA.count).toBeGreaterThanOrEqual(1)
      expect(refreshHitsB.count).toBeGreaterThanOrEqual(1)
      expect(await SessionModel.countDocuments()).toBe(sessionsBefore)
      expect(pageA.url()).not.toContain('/login')
      expect(pageB.url()).not.toContain('/login')
      await shot(pageA, 't2-dashboard-tab-a')
      await shot(pageB, 't2-dashboard-tab-b')
      await context.close()
    }
  )

  it(
    'a genuine 401 from /api/refresh still logs out',
    { timeout: 120_000 },
    async () => {
      const { page, cleanup } = await login()
      const refreshHits = { count: 0 }

      intercept(page, isConfigCall, { failTimes: 2, status: 401 })
      // Every refresh attempt rejected: the token is truly invalid.
      intercept(page, isRefreshCall, { failTimes: 999, status: 401, hits: refreshHits })

      await gotoReady(page, '/dashboard')
      await page.waitForURL('**/login', { timeout: 30000 })
      expect(refreshHits.count).toBeGreaterThanOrEqual(1)
      expect(page.url()).toContain('/login')
      await shot(page, 't3-login')
      await cleanup()
    }
  )
})
