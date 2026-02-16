import { test, expect } from '@playwright/test'

test('home shows plasma-wave when enabled', async ({ page }) => {
    // Force landing via URL to ensure it shows regardless of localStorage
    await page.goto('/?landing=plasma-wave')

    // Check for the landing container
    // Note: We look for the testid defined in LandingCube.tsx
    const landingScreen = page.locator('[data-testid="landing-cube-screen"]')
    await expect(landingScreen).toBeVisible()
})
