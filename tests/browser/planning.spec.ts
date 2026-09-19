import { test, expect, type Page } from "@playwright/test";
async function fill(page: Page) {
  await page.getByLabel("Destination", { exact: true }).fill("Tokyo, Japan");
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-20");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-23");
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/runtime?verify=1", (route) =>
    route.fulfill({
      json: {
        ready: true,
        keyConfigured: true,
        engine: "openai",
        model: "gpt-4o-mini",
        harnessConfigured: false,
        message: "Test provider ready.",
      },
    }),
  );
});
async function generate(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Generate Trip" }),
  ).toBeEnabled();
  await fill(page);
  await page.getByRole("button", { name: "Generate Trip" }).click();
  await expect(
    page.getByRole("region", { name: "Your itinerary", exact: true }),
  ).toBeVisible();
}
async function chaos(page: Page, name: string) {
  await page.getByRole("button", { name: "Chaos lab", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(name) })
    .click();
}

test("trip form validates destination and dates", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Generate Trip" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Generate Trip" }).click();
  await expect(page.getByText("Enter a destination.")).toBeVisible();
  await fill(page);
  await page.getByLabel("End date", { exact: true }).fill("2026-09-19");
  await page.getByRole("button", { name: "Generate Trip" }).click();
  await expect(
    page.getByText("End date must be on or after the start date."),
  ).toBeVisible();
});
test("streams generation, renders map and all days, regenerates", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await generate(page);
  await expect(page.getByLabel("Interactive itinerary map")).toBeVisible();
  await page.getByRole("tab", { name: /Day 4/ }).click();
  await expect(
    page.getByRole("region", { name: "Day 4", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Regenerate", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test("unauthorized tool is blocked visibly in AgentOps", async ({ page }) => {
  await generate(page);
  await chaos(page, "Unauthorized cancellation");
  await expect(
    page.getByText("Planner lacks cancellation permission.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("hotel.cancel", { exact: true })).toBeVisible();
});
test("human approval pauses and records demo decision", async ({ page }) => {
  await generate(page);
  await chaos(page, "Booking approval");
  await page.getByRole("button", { name: "Approve demo" }).click();
  await expect(
    page.getByText(/Simulation only; no booking or payment executed/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve demo" })).toHaveCount(
    0,
  );
});
test("restaurant closure changes one activity and preserves prior plan on error", async ({
  page,
}) => {
  await generate(page);
  await chaos(page, "Restaurant closure");
  await expect(page.getByText(/Only one activity replaced/)).toBeVisible();
  await page.getByRole("button", { name: "Trip workspace" }).click();
  await page.getByRole("tab", { name: /Day 2/ }).click();
  await expect(
    page.getByText("Replacement venue", { exact: true }),
  ).toBeVisible();
  await page.route("**/api/runtime*", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 200,
          contentType: "application/x-ndjson",
          body:
            JSON.stringify({
              type: "error",
              code: "TEST",
              message: "Test provider failure.",
            }) + "\n",
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Regenerate", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Test provider failure.");
  await expect(
    page.getByRole("region", { name: "Your itinerary", exact: true }),
  ).toBeVisible();
});
test("deployment readiness blocks generation before missing-key failure", async ({
  page,
}) => {
  await page.route("**/api/runtime*", (r) =>
    r.fulfill({
      json: {
        ready: false,
        keyConfigured: false,
        engine: "openai",
        model: "gpt-4o-mini",
        harnessConfigured: false,
        message: "Set TRAVELOS_OPENAI_API_KEY in Vercel and redeploy.",
      },
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Set TRAVELOS_OPENAI_API_KEY",
  );
  await expect(
    page.getByRole("button", { name: "Generate Trip" }),
  ).toBeDisabled();
});
test("mobile and desktop stay within viewport", async ({ page }) => {
  await generate(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Chaos lab", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
