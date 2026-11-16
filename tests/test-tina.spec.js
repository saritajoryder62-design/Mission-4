// @ts-check
import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:5173/';
const OPT_IN_TEXT = /may I ask you a few personal questions/i;
const TINA_ERROR = 'Tina is having trouble right now. Please try again.';

// Safety net: fake the backend for EVERY test, so no test can ever call real Gemini.
// A test that needs a different answer adds its own page.route(), which wins
// because Playwright checks the most recently added route first.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: 'This is a fake reply from the test.' }),
    })
  );
});

// Opens the chat panel the way a real user does: clicking the round icon
/** @param {import('@playwright/test').Page} page */
async function openChat(page) {
  await page.goto(APP_URL);
  await page.getByRole('button', { name: 'Chat with Tina' }).click();
  // The <section aria-label="Chat with Tina"> becomes a "region" for Playwright
  const panel = page.getByRole('region', { name: 'Chat with Tina' });
  await expect(panel).toBeVisible();
  return panel;
}

// Types a message and sends it
/** @param {import('@playwright/test').Locator} panel
 *  @param {string} text
 */
async function sendMessage(panel, text) {
  await panel.getByRole('textbox', { name: 'Type your message' }).fill(text);
  await panel.getByRole('button', { name: 'Send' }).click();
}

test.describe('Tina chatbot', () => {
  test('pop-up bubble shows the opt-in question after a few seconds', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.getByText(OPT_IN_TEXT)).toBeVisible({ timeout: 6000 });
  });

  test('opening the chat shows the opt-in question inside the panel', async ({ page }) => {
    const panel = await openChat(page);
    await expect(panel.getByText(OPT_IN_TEXT)).toBeVisible();
  });

  test('user can send a message and gets a reply', async ({ page }) => {
    // Fake the backend so we don't call Gemini (fast, free, predictable)
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Great! What type of vehicle do you drive?' }),
      })
    );

    const panel = await openChat(page);
    await sendMessage(panel, 'Yes, go ahead');

    await expect(panel.getByText('Yes, go ahead')).toBeVisible();
    await expect(panel.getByText('Great! What type of vehicle do you drive?')).toBeVisible();
  });

  test('shows a friendly message when the backend returns an error', async ({ page }) => {
    // Same shape your Express catch block sends
    await page.route('**/api/chat', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: TINA_ERROR }),
      })
    );

    const panel = await openChat(page);
    await sendMessage(panel, 'Yes');

    await expect(panel.getByText(TINA_ERROR)).toBeVisible();
  });

  test('shows a friendly message even if the error is not JSON', async ({ page }) => {
    await page.route('**/api/chat', (route) =>
      route.fulfill({ status: 500, contentType: 'text/plain', body: 'Server error' })
    );

    const panel = await openChat(page);
    await sendMessage(panel, 'Yes');

    // App.jsx falls back to its own message when it can't read the error as JSON
    await expect(panel.getByText(TINA_ERROR)).toBeVisible();
    await expect(panel.getByText(/not valid JSON/i)).toHaveCount(0);
  });

  test('pressing Escape closes the chat panel', async ({ page }) => {
    const panel = await openChat(page);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });
});
