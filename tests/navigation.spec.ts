import { test, expect } from '@playwright/test';

test.describe('Navigation (unauthenticated)', () => {
  test('should redirect to login from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/projects',
      '/ministries',
      '/recurring',
      '/weekly-planner',
      '/calendar',
      '/profile',
      '/settings',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login');
    }
  });
});
