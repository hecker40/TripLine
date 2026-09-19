import { test, expect, type Page } from '@playwright/test';

async function fillTrip(page: Page) {
  await page.getByLabel('Destination', { exact: true }).fill('Tokyo, Japan');
  await page.getByLabel('Start date', { exact: true }).fill('2026-09-20');
  await page.getByLabel('End date', { exact: true }).fill('2026-09-23');
  await page.getByLabel('Anything else?').fill('Do not schedule anything before 9 AM.');
}
async function generate(page: Page) {
  await fillTrip(page);
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByRole('region', { name: 'Your itinerary', exact: true })).toBeVisible();
}

test('empty state, required fields, date range validation, and retained inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A good trip starts with you.' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByText('Enter a destination.')).toBeVisible();
  await fillTrip(page);
  await page.getByLabel('End date', { exact: true }).fill('2026-09-19');
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByText('End date must be on or after the start date.')).toBeVisible();
  await expect(page.getByLabel('Destination', { exact: true })).toHaveValue('Tokyo, Japan');
});

test('real HTTP flow with test provider, loading, four days, costs, and same-preference regeneration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await fillTrip(page);
  const response = page.waitForResponse('**/api/trips/generate');
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByRole('status')).toContainText('Planning your trip');
  await expect(page.getByRole('button', { name: 'Planning your trip' })).toBeDisabled();
  expect((await response).status()).toBe(200);
  for (let day = 1; day <= 4; day++) await expect(page.getByRole('region', { name: `Day ${day}`, exact: true })).toBeVisible();
  await expect(page.getByText('$200.00', { exact: true })).toBeVisible();
  await expect(page.getByText('120 min', { exact: true })).toHaveCount(4);
  await page.getByLabel('Destination', { exact: true }).fill('Paris, France');
  const request = page.waitForRequest('**/api/trips/generate');
  await page.getByRole('button', { name: 'Regenerate' }).click();
  expect((await request).postDataJSON().destination).toBe('Tokyo, Japan');
  await expect(page.getByRole('button', { name: 'Regenerate' })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Tokyo, Japan', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('regeneration failure preserves prior trip and edited form; retry recovers', async ({ page }) => {
  await page.goto('/');
  await generate(page);
  await page.getByLabel('Destination', { exact: true }).fill('Kyoto, Japan');
  await page.route('**/api/trips/generate', (route) => route.fulfill({
    status: 504, json: { error: { code: 'PLANNER_TIMEOUT', message: 'Planning took too long. Please try again.' } },
  }));
  await page.getByRole('button', { name: 'Regenerate' }).click();
  await expect(page.getByRole('alert')).toContainText('Your previous itinerary is still here.');
  await expect(page.getByRole('heading', { name: 'Tokyo, Japan', exact: true })).toBeVisible();
  await expect(page.getByLabel('Destination', { exact: true })).toHaveValue('Kyoto, Japan');
  await page.unroute('**/api/trips/generate');
  await page.getByRole('button', { name: 'Try Again' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Regenerate' })).toBeEnabled();
});

test('malformed response shows a useful error, not broken itinerary cards', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/trips/generate', (route) => route.fulfill({ status: 200, json: { itinerary: { days: [] } } }));
  await fillTrip(page);
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByRole('alert')).toContainText('invalid itinerary');
  await expect(page.getByRole('region', { name: 'Your itinerary', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Destination', { exact: true })).toHaveValue('Tokyo, Japan');
});

test('layout fits the viewport before and after generation', async ({ page }, testInfo) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('empty.png'), fullPage: true });
  await generate(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('itinerary.png'), fullPage: true });
});

test('a missing deployed API reports a deployment issue instead of a generic planner error', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/trips/generate', (route) => route.fulfill({
    status: 404, contentType: 'text/html', body: '<h1>Not Found</h1>',
  }));
  await fillTrip(page);
  await page.getByRole('button', { name: 'Generate Trip' }).click();
  await expect(page.getByRole('alert')).toContainText('API is missing from this deployment');
});
