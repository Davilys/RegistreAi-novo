import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PRICING, pricingPromptLines } from "@registreai/product-config";

const root = new URL("../../../", import.meta.url);
test("canonical commercial prices match the approved offer", () => {
  assert.deepEqual([PRICING.protection.setupCents, PRICING.protection.monthlyCents], [19700, 4900]);
  assert.deepEqual([PRICING.unlimited.setupCents, PRICING.unlimited.monthlyCents], [49700, 59900]);
  assert.equal(PRICING.unlimited.noWaitingPeriod, true);
  assert.match(pricingPromptLines().join("\n"), /R\$197.*R\$49.*R\$497.*R\$599/s);
});
test("site and worker consume the canonical pricing package", async () => {
  const [company, prompt] = await Promise.all([
    readFile(new URL("src/config/company.ts", root), "utf8"),
    readFile(new URL("services/reg-worker/src/prompt.ts", root), "utf8")
  ]);
  assert.match(company, /PRICING\.protection\.setupDisplay/);
  assert.match(company, /PRICING\.unlimited\.monthlyDisplay/);
  assert.match(prompt, /pricingPromptLines\(\)/);
  assert.doesNotMatch(company + prompt, /R\$\s*(299|999)\b/);
});
test("database reference seed agrees with canonical cents", async () => {
  const seed = await readFile(new URL("supabase/seed/reference_data.sql", root), "utf8");
  for (const value of [PRICING.protection.setupCents, PRICING.protection.monthlyCents, PRICING.unlimited.setupCents, PRICING.unlimited.monthlyCents]) assert.match(seed, new RegExp(`\\b${value}\\b`));
});
