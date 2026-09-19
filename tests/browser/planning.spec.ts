import { test, expect, type Page } from "@playwright/test";
async function fill(page: Page) {
  await page.getByLabel("Destination", { exact: true }).fill("Tokyo, Japan");
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-20");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-23");
}
test.beforeEach(async ({ page }) => {
  await page.route("**/api/maps", async (route) => {
    const { envelope, date, mode } = route.request().postDataJSON();
    const activities = envelope.run.itinerary.days.find(
      (d: { date: string }) => d.date === date,
    ).activities;
    await route.fulfill({
      json: {
        date,
        mode,
        stops: activities.map((a: { id: string }, i: number) => ({
          id: a.id,
          coordinates: i === 0 ? [35.714, 139.797] : [35.715, 139.774],
          source: "planner",
          matchedName: null,
        })),
        legs: activities.slice(1).map((a: { id: string }, i: number) => ({
          from: activities[i].id,
          to: a.id,
          distanceKm: 2.1,
          minutes: 25,
          coordinates: [
            [35.714, 139.797],
            [35.72, 139.78],
            [35.715, 139.774],
          ],
        })),
        warnings: [],
      },
    });
  });
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
    page
      .locator(".ops-main")
      .getByText("Planner lacks cancellation permission.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.locator(".ops-main").getByText("hotel.cancel", { exact: true }),
  ).toBeVisible();
});
test("human approval pauses and records demo decision", async ({ page }) => {
  await generate(page);
  await chaos(page, "Booking approval");
  await page.getByRole("button", { name: "Approve demo" }).click();
  await expect(
    page
      .locator(".ops-main")
      .getByText(/Simulation only; no booking or payment executed/),
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
  await expect(
    page.locator(".ops-main").getByText(/Only one activity replaced/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Trip workspace" }).click();
  await page.getByRole("tab", { name: /Day 1/ }).click();
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

test("day map follows tabs, highlights timed stops and offers directions", async ({
  page,
}) => {
  await generate(page);
  await expect(
    page.getByRole("region", { name: "Map for day 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Check location" }).first(),
  ).toHaveAttribute("href", /google.com\/maps\/search/);
  await page.getByRole("tab", { name: /Day 3/ }).click();
  const map = page.getByRole("region", { name: "Map for day 3", exact: true });
  await expect(map).toBeVisible();
  await expect(map.locator(".leaflet-overlay-pane path")).toHaveCount(5);
  await expect(
    map.getByRole("link", { name: "Transit directions" }).first(),
  ).toHaveAttribute("href", /travelmode=transit/);
  await expect(
    page.getByRole("region", { name: "Map for day 1", exact: true }),
  ).toHaveCount(0);
  await map.locator(".route-stop-select").first().click();
  await expect(page.locator(".timeline li.selected")).toHaveCount(1);
  await expect(page.locator(".map-marker.active")).toHaveCount(1);
  await page.getByLabel("Route preview mode").selectOption("driving");
  await expect(map.locator(".route-stop-select").first()).toContainText(
    "09:30–10:15",
  );
});

test("traveler adjustment updates selected day, displays Adapter progress and preserves others", async ({
  page,
}) => {
  await generate(page);
  await page.getByRole("tab", { name: /Day 2/ }).click();
  await page
    .getByLabel("What went wrong?")
    .fill("I missed my reservation. Suggest an alternative nearby.");
  await page.getByLabel("Resume planning at", { exact: true }).fill("09:00");
  await page
    .getByRole("button", { name: "Adjust this day", exact: true })
    .click();
  await expect(page.locator(".timeline")).toContainText("Recovered visit");
  await expect(page.locator('[data-agent="Adapter"]')).toContainText(
    "Complete",
  );
  await expect(
    page.getByRole("region", { name: "Agent progress", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Day 1/ }).click();
  await expect(page.locator(".timeline")).not.toContainText("Recovered visit");
});

test("agent progress is visible during generation without opening AgentOps", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Generate Trip" }),
  ).toBeEnabled();
  await fill(page);
  await page.getByRole("button", { name: "Generate Trip" }).click();
  const progress = page.getByRole("region", {
    name: "Agent progress",
    exact: true,
  });
  await expect(progress).toBeVisible();
  await expect(progress.locator('[data-agent="Research"]')).not.toContainText(
    "No activity reported",
  );
  await expect(
    page.getByRole("region", { name: "Your itinerary", exact: true }),
  ).toBeVisible();
  await expect(progress.locator('[data-agent="Planner"]')).toContainText(
    "Complete",
  );
  await expect(progress.locator('[data-agent="Adapter"]')).toContainText(
    "Not used",
  );
});

test("trip length sets dates and all requested days are visibly summarized", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Generate Trip" }),
  ).toBeEnabled();
  await fill(page);
  await page.getByLabel("Trip length", { exact: true }).selectOption("4");
  await expect(page.getByLabel("End date", { exact: true })).toHaveValue(
    "2026-09-23",
  );
  await page.getByRole("button", { name: "Generate Trip" }).click();
  const overview = page.getByRole("region", { name: "All trip days" });
  await expect(overview).toBeVisible();
  await expect(overview.locator(".all-days-grid > button")).toHaveCount(4);
  await expect(overview).toContainText("4 DAYS · 3 NIGHTS");
  await expect(page.getByLabel("Day planning progress")).toContainText("Day 4");
  await overview.locator(".all-days-grid > button").nth(3).click();
  await expect(
    page.getByRole("region", { name: "Day 4", exact: true }),
  ).toBeVisible();
});

test("Booking.com missing credentials are honest, with trip-specific manual handoff", async ({
  page,
}) => {
  await generate(page);
  const stays = page.getByRole("region", { name: "Booking.com stays" });
  await expect(stays).toContainText("BOOKING_AFFILIATE_ID");
  await expect(
    stays.getByRole("button", { name: "Search live stays" }),
  ).toBeDisabled();
  await expect(
    stays.getByRole("link", { name: /Open Booking.com search/ }),
  ).toHaveAttribute("href", /checkin=2026-09-20&checkout=2026-09-23/);
});

test("configured Booking.com search displays returned hotel results without booking", async ({
  page,
}) => {
  await page.route("**/api/runtime?verify=1", (r) =>
    r.fulfill({
      json: {
        ready: true,
        keyConfigured: true,
        engine: "openai",
        model: "gpt-4o-mini",
        harnessConfigured: false,
        bookingConfigured: true,
        message: "Test providers configured",
      },
    }),
  );
  await generate(page);
  const stays = page.getByRole("region", { name: "Booking.com stays" });
  await stays.getByRole("button", { name: "Search live stays" }).click();
  await expect(stays).toContainText("Test-only partner hotel");
  await expect(stays).toContainText("$240.00");
  await expect(
    stays.getByRole("link", { name: /Review on Booking.com/ }),
  ).toHaveAttribute("href", "https://www.booking.com/hotel/jp/test.html");
  await expect(stays).toContainText("Nothing booked");
});
