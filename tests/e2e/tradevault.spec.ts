import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("TradeVault").first()).toBeVisible();
});

test("loads a realistic demo and renders trading analytics", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Covered by the desktop workflow.",
  );
  await page.getByRole("button", { name: "Vault settings" }).click();
  await page.getByRole("button", { name: /Load demo workspace/ }).click();
  await expect(page.getByText("Demo workspace loaded.")).toBeVisible();
  await page.getByRole("button", { name: "Command center" }).click();
  await expect(page.getByText("Net performance")).toBeVisible();
  await expect(page.getByText(/12 trades/).first()).toBeVisible();
  await expect(page.getByText("Account trajectory")).toBeVisible();
});

test("logs and finds a trade in the journal", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Covered by the desktop workflow.",
  );
  await page.getByRole("button", { name: "Log execution" }).click();
  await page.getByLabel("Symbol").fill("ETHUSD");
  await page.getByLabel("Market").selectOption("Crypto");
  await page.getByLabel("R multiple").fill("2.5");
  await page.getByLabel("Realized PnL").fill("250");
  await page
    .getByLabel("Review notes")
    .fill("Confirmed reclaim and patient execution.");
  await page.getByRole("button", { name: "Commit to journal" }).click();
  await expect(page.getByText("ETHUSD")).toBeVisible();
  await page
    .getByPlaceholder("Search symbol, setup, note, or tag")
    .fill("patient");
  await expect(page.getByText("ETHUSD")).toBeVisible();
});

test("has no automatically detectable WCAG A or AA violations", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Desktop scan covers the full application shell.",
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("mobile navigation reaches the trade form", async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.includes("mobile"),
    "Mobile-only interaction.",
  );
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Log execution" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Log a trade" }),
  ).toBeVisible();
});
