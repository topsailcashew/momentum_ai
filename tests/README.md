# Playwright E2E Tests

This directory contains end-to-end tests for the Pace Pilot app using Playwright.

## Setup

Playwright and the MCP server have been installed and configured.

### Installed Components

1. **Playwright Test Framework** - `@playwright/test` and `playwright` packages
2. **Playwright MCP Server** - `@playwright/mcp` installed globally
3. **MCP Configuration** - Located at `~/.config/claude-code/mcp_settings.json`

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run tests with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (visible browser)
```bash
npm run test:e2e:headed
```

## Test Files

- **auth.spec.ts** - Tests authentication flows (login/signup pages)
- **navigation.spec.ts** - Tests navigation and route protection
- **homepage.spec.ts** - Tests that the app loads properly and is not stuck on loading screen

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project.

Key settings:
- Base URL: `http://localhost:3000`
- Test directory: `./tests`
- Browser: Chromium (Desktop Chrome)
- Web server: Automatically starts dev server before tests

## Adding New Tests

Create new test files in this directory with the `.spec.ts` extension. Follow the pattern:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-route');
    // Your test assertions here
  });
});
```

## Playwright MCP

The Playwright MCP server allows Claude Code to interact with browser automation directly. It's configured to run automatically when needed.

To use it in Claude Code conversations, the MCP server provides tools for:
- Browser navigation
- Element interaction
- Screenshots
- Network inspection
- And more

## Troubleshooting

If tests fail:
1. Make sure the dev server is running (`npm run dev`)
2. Check that the app is accessible at `http://localhost:3000`
3. Verify the GOOGLE_API_KEY is set in `.env.local`
4. Run tests in headed mode to see what's happening: `npm run test:e2e:headed`
