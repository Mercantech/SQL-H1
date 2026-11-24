// Run against a local preview or a deployment. API responses are fixtures and all
// learning/progress requests are intercepted inside this isolated browser.
// Optional environment variables: PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE.
import assert from "node:assert/strict";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

const base = new URL(process.argv[2] ?? "http://localhost:5173").origin;
const library = process.env.PLAYWRIGHT_MODULE ?? "playwright";
const { chromium } = await import(isAbsolute(library) ? pathToFileURL(library).href : library);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, headless: true });

try {
  const question = { question: "Hvilke rækker får du?", hint: "Følg kunden.", answer: "Anna har to ordrer." };
  const block = ["```teach", JSON.stringify(question), "```"].join("\n");
  const lesson = {
    slug: "select-01-intro", module: "select", kind: "theory", order: 1, title: "Læs rækker", objectives: [],
    markdown: ["# Læs rækker", "## Prøv selv", block, "## Gentag", block].join("\n\n"),
  };
  const exercise = {
    slug: "select-ex-01", module: "select", kind: "exercise", order: 2, title: "Find ordrer", objectives: [],
    markdown: "# Find ordrer\n\nFind en kunde og hendes ordrer.", sandbox: { allowWrite: true, starterSql: "SELECT 1;" },
    answerParts: [{ id: "a", label: "Kunder" }, { id: "b", label: "Ordrer", starterSql: "SELECT " }],
  };
  const module = {
    slug: "select", title: "SELECT", order: 1, description: "Find rækker", objectives: [], items: [lesson, exercise],
    referenceMarkdown: "## Opslag om rækker\n\nFiltrér med WHERE.",
  };
  const runs = [];
  const checks = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(12000);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let json = [];
    if (path === "/api/modules") json = [module];
    if (path === "/api/content/" + lesson.slug) json = lesson;
    if (path === "/api/content/" + exercise.slug) json = exercise;
    if (path === "/api/me") json = { sub: "fixture", displayName: "Test", sandbox: { status: "ready", dbName: "øvelse" } };
    if (path === "/api/raymond/status") json = { enabled: false };
    if (path === "/api/sandbox/execute") {
      const body = request.postDataJSON();
      runs.push(body);
      json = { ok: true, columns: ["kunde"], rows: [[body.sql]] };
    }
    if (path === "/api/sandbox/check") {
      const body = request.postDataJSON();
      checks.push(body);
      const parts = body.answers.map(({ partId, sql }) => ({
        id: partId, passed: sql === "SELECT 2;", message: sql === "SELECT 2;" ? "Resultatet stemmer." : "Undersøg rækkerne.",
      }));
      json = { passed: parts.every((part) => part.passed), parts, messages: parts.map((part) => part.message) };
    }
    await route.fulfill({ json });
  });

  await page.goto(base + "/learn/" + lesson.slug);
  const first = page.locator(".teach-checkpoint").first();
  await first.waitFor();
  assert.equal(await first.getByText(question.answer).isVisible(), false);
  await first.getByText("Vis forklaring").focus();
  await page.keyboard.press("Space");
  assert.ok(await first.getByText(question.answer).isVisible());
  assert.equal(await page.locator(".teach-checkpoint").nth(1).getByText(question.answer).isVisible(), false);
  await page.getByRole("link", { name: "Opslagsark" }).click();
  await page.getByRole("heading", { name: "Opslag om rækker" }).waitFor();
  assert.ok(page.url().endsWith("#opslag"));
  assert.equal(await page.evaluate(() => document.activeElement.id), "opslag");
  await page.emulateMedia({ media: "print" });
  assert.ok(await page.locator("#opslag").isVisible());
  assert.equal(await page.locator(".item-list").isVisible(), false);
  assert.equal(await page.locator(".topbar").isVisible(), false);
  await page.emulateMedia({ media: "screen" });

  await page.goto(base + "/present/" + lesson.slug);
  await page.locator(".present-slide").waitFor();
  await page.keyboard.press("End");
  const slide = page.locator(".present-slide");
  await slide.getByText("Vis forklaring").click();
  assert.ok(await slide.getByText(question.answer).isVisible());
  await page.keyboard.press("ArrowLeft");
  await slide.getByRole("heading", { name: "Prøv selv" }).waitFor();
  assert.equal(await slide.getByText(question.answer).isVisible(), false);

  await page.setViewportSize({ width: 390, height: 844 });
  const help = page.locator(".raymond-launcher");
  const nextSlide = page.locator(".present-footer button.primary");
  const previousSlide = page.locator(".present-footer button.ghost");
  for (const open of [false, true]) {
    if (open) await help.click();
    assert.equal(await help.getAttribute("aria-expanded"), String(open));
    const middleIsClickable = await nextSlide.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest("button") === button;
    });
    assert.ok(middleIsClickable, "Raymond covers the next-slide button");
    await nextSlide.click();
    await slide.getByRole("heading", { name: "Gentag" }).waitFor();
    await previousSlide.click();
    await slide.getByRole("heading", { name: "Prøv selv" }).waitFor();
    if (open) await help.click();
    assert.equal(await help.getAttribute("aria-expanded"), "false");
  }
  await page.goto(base + "/learn/" + exercise.slug);
  await page.getByRole("button", { name: "Log ind for at besvare opgaven" }).waitFor();
  await page.evaluate(() => {
    sessionStorage.setItem("sqlh1_access_token", "browser-test-fixture");
    sessionStorage.setItem("sqlh1_expires_at", String(Date.now() + 3600000));
    sessionStorage.setItem("sqlh1_module_nav_open", "0");
  });
  await page.reload();
  const customer = page.getByLabel("Kunder", { exact: true });
  const orders = page.getByLabel("Ordrer", { exact: true });
  await customer.fill("SELECT 2;");
  await orders.fill("SELECT 1;");
  await page.getByRole("button", { name: "Kør SQL for Kunder" }).click();
  await page.locator(".answer-preview").getByRole("cell", { name: "SELECT 2;" }).waitFor();
  await orders.fill("SELECT 1;");
  await orders.press("Control+Enter");
  await page.locator(".answer-preview").getByRole("cell", { name: "SELECT 1;" }).waitFor();
  assert.deepEqual(runs, ["SELECT 2;", "SELECT 1;"].map(sql => ({ sql, contentSlug: exercise.slug, allowWrite: false })));
  assert.equal(checks.length, 0);
  const submit = page.getByRole("button", { name: "Tjek svar", exact: true });
  await submit.click();
  await page.getByText("Opgaven er ikke bestået endnu.").waitFor();
  assert.equal(await orders.getAttribute("aria-invalid"), "true");
  assert.deepEqual(checks[0], { contentSlug: exercise.slug, answers: [{ partId: "a", sql: "SELECT 2;" }, { partId: "b", sql: "SELECT 1;" }] });
  await orders.fill("SELECT 2;");
  await submit.press("Enter");
  await page.getByText("Opgaven er bestået.").waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  console.log("OK: offentlig teori, selvtjek, præsentation, print, mobil, prøvekørsel og validering af delopgaver.");
} finally {
  await browser.close();
}
