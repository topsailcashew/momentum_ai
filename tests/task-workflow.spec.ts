import { test, expect } from '@playwright/test';

/**
 * E2E tests for authenticated task workflows
 *
 * NOTE: These tests require authentication to be properly set up.
 * They are designed to test the full task lifecycle from a user's perspective.
 */

test.describe('Task Workflow (requires auth)', () => {
  test.skip('should allow authenticated user to create a new task', async ({ page }) => {
    // This test is skipped because it requires authentication setup
    // To enable:
    // 1. Set up authentication state storage
    // 2. Use storageState option in test config
    // 3. Create a setup script that logs in and saves auth state

    await page.goto('/dashboard');

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="quick-add-task"]', { timeout: 10000 });

    // Add a new task
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('E2E Test Task');
    await input.press('Enter');

    // Verify task appears in the list
    await expect(page.getByText('E2E Test Task')).toBeVisible();
  });

  test.skip('should allow user to complete a task', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a task first
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('Task to Complete');
    await input.press('Enter');

    // Wait for task to appear
    await page.waitForSelector('text=Task to Complete');

    // Click checkbox to complete
    const taskRow = page.locator('text=Task to Complete').locator('..');
    const checkbox = taskRow.locator('[type="checkbox"]');
    await checkbox.click();

    // Verify task is marked as completed
    await expect(checkbox).toBeChecked();
  });

  test.skip('should allow user to delete a task', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a task
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill('Task to Delete');
    await input.press('Enter');

    // Wait for task to appear
    await page.waitForSelector('text=Task to Delete');

    // Open task menu/actions
    const taskRow = page.locator('text=Task to Delete').locator('..');
    const menuButton = taskRow.getByRole('button', { name: /more/i });
    await menuButton.click();

    // Click delete
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify task is removed
    await expect(page.getByText('Task to Delete')).not.toBeVisible();
  });
});

test.describe('Project Workflow (requires auth)', () => {
  test.skip('should allow user to create a project', async ({ page }) => {
    await page.goto('/projects');

    // Click add project button
    const addButton = page.getByRole('button', { name: /add project/i });
    await addButton.click();

    // Fill in project details
    await page.getByPlaceholder(/project name/i).fill('E2E Test Project');

    // Select priority
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: /high/i }).click();

    // Save project
    await page.getByRole('button', { name: /save|create/i }).click();

    // Verify project appears
    await expect(page.getByText('E2E Test Project')).toBeVisible();
  });

  test.skip('should show project progress', async ({ page }) => {
    await page.goto('/projects');

    // Assuming a project exists, check for progress indicator
    const progressIndicator = page.locator('[data-testid="project-progress"]').first();
    await expect(progressIndicator).toBeVisible();
  });
});

test.describe('Energy Tracking (requires auth)', () => {
  test.skip('should allow user to set energy level', async ({ page }) => {
    await page.goto('/dashboard');

    // Find energy input
    const energyButton = page.getByRole('button', { name: /energy/i });
    await energyButton.click();

    // Select High energy
    await page.getByRole('option', { name: /high/i }).click();

    // Verify energy is set
    await expect(page.getByText(/high/i)).toBeVisible();
  });
});

test.describe('Weekly Planner (requires auth)', () => {
  test.skip('should display weekly planner view', async ({ page }) => {
    await page.goto('/weekly-planner');

    // Check for day columns
    await expect(page.getByText(/monday/i)).toBeVisible();
    await expect(page.getByText(/tuesday/i)).toBeVisible();
    await expect(page.getByText(/wednesday/i)).toBeVisible();
    await expect(page.getByText(/thursday/i)).toBeVisible();
    await expect(page.getByText(/friday/i)).toBeVisible();
  });

  test.skip('should allow dragging tasks between days', async ({ page }) => {
    await page.goto('/weekly-planner');

    // This would require setting up drag and drop testing
    // which is more complex but important for the weekly planner functionality
  });
});

/**
 * Unauthenticated test to verify the tests above need auth
 */
test.describe('Task Workflow - Unauthenticated', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing projects without auth', async ({ page }) => {
    await page.goto('/projects');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing weekly planner without auth', async ({ page }) => {
    await page.goto('/weekly-planner');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});
