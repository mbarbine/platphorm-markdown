import { expect, test } from "@playwright/test"

test("homepage and FAQ remain public and routed", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: /open editor/i }).first()).toBeVisible()
  await expect(page.getByText("Browser-first", { exact: false }).first()).toBeVisible()

  await page.goto("/faq")
  await expect(page.getByText("Frequently Asked Questions")).toBeVisible()
  await expect(page.getByRole("link", { name: "Home" })).toBeVisible()
})

test("editor renders graph, preview, export states, and tooltips", async ({ page }) => {
  await page.goto("/editor")

  await page.getByRole("button", { name: /graph view/i }).click()
  await expect(page.locator(".react-flow").first()).toBeVisible()

  await page.getByRole("button", { name: /preview mode/i }).click()
  await expect(page.locator("article")).toContainText("h1 Heading")

  await expect(page.getByRole("button", { name: /copy share url/i })).toHaveAttribute("title", /not stored server-side/i)
  await page.getByRole("button", { name: /export/i }).click()
  await expect(page.getByText("Export as Markdown")).toBeVisible()
  await expect(page.getByText("Export PDF unavailable")).toBeVisible()
  await expect(page.getByText("Export PNG unavailable")).toBeVisible()
})
