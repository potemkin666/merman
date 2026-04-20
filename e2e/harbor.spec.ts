import { test, expect, _electron as electron } from '@playwright/test'
import { resolve } from 'path'

// The Electron app entry point after build
const MAIN_ENTRY = resolve(__dirname, '../out/main/index.js')

/**
 * Helper: launch the app and dismiss the welcome overlay if shown.
 */
async function launchApp() {
  const app = await electron.launch({
    args: [MAIN_ENTRY],
    env: {
      ...process.env,
      // Disable GPU to avoid CI issues with headless environments
      ELECTRON_DISABLE_GPU: '1',
    },
  })

  const window = await app.firstWindow()

  // Dismiss the welcome overlay if it appears
  const skipButton = window.locator('button[aria-label="Skip welcome tour"]')
  try {
    await skipButton.click({ timeout: 8000 })
  } catch {
    // Welcome overlay might not appear if already dismissed
  }

  return { app, window }
}

test.describe('Harbor smoke test', () => {
  test('app launches, renders the Harbor screen, and shows the title', async () => {
    const { app, window } = await launchApp()

    // Wait for the Harbor title to appear — this proves the renderer loaded and React rendered
    const title = window.locator('h1')
    await expect(title).toHaveText('The Harbour', { timeout: 15000 })

    // Verify the status card is present
    const statusCard = window.locator('[role="status"]')
    await expect(statusCard.first()).toBeVisible({ timeout: 5000 })

    // Verify the sidebar navigation is present
    const sidebar = window.locator('nav')
    await expect(sidebar).toBeVisible({ timeout: 5000 })

    // Check that the Tide Bar is rendered
    const tideBar = window.locator('.tide-bar')
    await expect(tideBar).toBeVisible({ timeout: 5000 })

    await app.close()
  })

  test('can navigate to Dispatch screen', async () => {
    const { app, window } = await launchApp()

    // Wait for Harbor to load
    await expect(window.locator('h1')).toHaveText('The Harbour', { timeout: 15000 })

    // Click on Dispatch in sidebar using specific aria-label, with force to bypass animation instability
    await window.locator('button[aria-label="Navigate to Dispatch"]').click({ force: true })

    // Verify we navigated to the Dispatch screen
    await expect(window.locator('h1')).toHaveText('Dispatch', { timeout: 5000 })

    await app.close()
  })

  test('can navigate to Fishtank screen', async () => {
    const { app, window } = await launchApp()

    // Wait for Harbor to load
    await expect(window.locator('h1')).toHaveText('The Harbour', { timeout: 15000 })

    // Click on Fishtank in sidebar using specific aria-label, with force to bypass animation instability
    await window.locator('button[aria-label="Navigate to Fishtank"]').click({ force: true })

    // Verify we navigated to the Fishtank screen
    await expect(window.locator('h1')).toHaveText('The Fishtank', { timeout: 5000 })

    // Verify the fishtank tank element is present
    const tank = window.locator('.fishtank-tank')
    await expect(tank).toBeVisible({ timeout: 5000 })

    await app.close()
  })
})
