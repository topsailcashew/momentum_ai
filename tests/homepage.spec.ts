import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should not be stuck on loading screen', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to complete (either to login or to main page)
    await page.waitForURL(/\/(login|workday)?/, { timeout: 10000 });

    // Should not show the "Loading..." text anymore
    const loadingText = page.getByText('Loading...');
    await expect(loadingText).not.toBeVisible({ timeout: 5000 });
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pace Pilot/);
  });
});
