import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Check for login elements
    await expect(page.getByText('Pace Pilot')).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup');

    await expect(page).toHaveURL('/signup');
    await expect(page.getByText('Pace Pilot')).toBeVisible();
  });
});
