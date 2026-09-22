import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Static source consistency checks only. No secrets, network calls, messages,
// provider charges, production database writes or INPI acts are performed.
const root = new URL('../', import.meta.url);
const prompt = await readFile(new URL('services/reg-worker/src/prompt.ts', root), 'utf8');
const company = await readFile(new URL('src/config/company.ts', root), 'utf8');

function sitePrice(key) {
  const match = company.match(new RegExp(`${key}:\\s*\\{\\s*setup:\\s*'(\\d+)',\\s*monthly:\\s*'(\\d+)'\\s*\\}`));
  assert.ok(match, `Cannot find explicit site prices for ${key}; review the test after a schema change.`);
  return [Number(match[1]), Number(match[2])];
}
function promptPrice(name) {
  const match = prompt.match(new RegExp(`${name}: R\\$(\\d+) de adesão \\+ R\\$(\\d+)/mês`));
  assert.ok(match, `Cannot find Reg prices for ${name}; do not silently skip this check.`);
  return [Number(match[1]), Number(match[2])];
}

test('Proteção matches the owner-approved site prices', () => {
  assert.deepEqual(sitePrice('protection'), [197, 49]);
  assert.deepEqual(promptPrice('Proteção'), sitePrice('protection'));
});
test('Ilimitado matches the owner-approved site prices', () => {
  assert.deepEqual(sitePrice('unlimited'), [497, 599]);
  assert.deepEqual(promptPrice('Ilimitado'), sitePrice('unlimited'));
});
test('the operational prompt no longer advertises superseded setup fees', () => {
  assert.doesNotMatch(prompt, /R\$\s*(?:299|999)(?!\d)/);
});
test('a pricing correction preserves holder, federal fee and evidence rules', () => {
  assert.match(prompt, /mesmo CPF ou CNPJ titular do plano/);
  assert.match(prompt, /Taxas oficiais do INPI ficam à parte/);
  assert.match(prompt, /Pagamento precisa de confirmação externa/);
  assert.match(prompt, /sem recibo ou protocolo externo confirmado/);
  assert.match(prompt, /Você nunca finge ser humana/);
});
test('the changed commercial prompt has a new audit version', () => {
  assert.match(prompt, /REG_PROMPT_VERSION = "reg-v1\.1-pricing-20260922"/);
});
