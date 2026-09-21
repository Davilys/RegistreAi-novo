import { test, expect } from '@playwright/test';

const mascot = page => page.locator('.hero-mascot');
const count = page => page.evaluate(() => window.__regRecords.length);
const active = page => page.evaluate(() => document.getAnimations().filter(a => a.id.startsWith('reg-greeting-')).length);

async function recordAnimations(page, hold = false) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(({ hold }) => {
    window.__regRecords = [];
    window.__regAnimations = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function(frames, options) {
      const animation = original.call(this, frames, options);
      if (options?.id?.startsWith('reg-greeting-')) {
        window.__regRecords.push({
          id: options.id, duration: options.duration, iterations: options.iterations,
          fill: options.fill, owner: this.closest('svg')?.getAttribute('class'),
        });
        window.__regAnimations.push(animation);
        if (hold) animation.pause();
      }
      return animation;
    };
  }, { hold });
}
async function load(page) {
  await page.goto('/');
  await expect(mascot(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function trigger(page) {
  await mascot(page).scrollIntoViewIfNeeded();
  await expect.poll(() => count(page)).toBe(2);
}

for (const width of [390, 768, 1440]) {
  test(`greeting ${width}px: one second then static; no replay on scroll, resize or hover`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await recordAnimations(page);
    await load(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await trigger(page);
    await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
    expect(await active(page)).toBe(0);
    const records = await page.evaluate(() => window.__regRecords);
    expect(records.map(a => a.id)).toEqual(['reg-greeting-blink', 'reg-greeting-wave']);
    for (const record of records) {
      expect(record).toMatchObject({ duration: 1000, iterations: 1, fill: 'none', owner: 'hero-mascot' });
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
    await page.locator('#planos').scrollIntoViewIfNeeded();
    await mascot(page).scrollIntoViewIfNeeded();
    await mascot(page).hover();
    await page.mouse.move(0, 0);
    await page.setViewportSize({ width: width + 1, height: 844 });
    await page.waitForTimeout(1200);
    expect(await count(page)).toBe(2);
    expect(await active(page)).toBe(0);
    await expect(page.locator('.mascot-arrow')).toBeVisible();
    expect(await page.locator('.mascot-arrow').evaluate(el => el.getAnimations().length)).toBe(0);
    expect(await page.locator('.chat-body').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(page.locator('.protocol-bubble')).toContainText('Pedido protocolado no INPI em seu nome.');
  });
}

test('below-fold mascot waits until it enters the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 300 });
  await recordAnimations(page);
  await load(page);
  await page.waitForTimeout(300);
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'waiting');
  expect(await count(page)).toBe(0);
  await trigger(page);
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
});

test('reduced motion from page load never animates, even when preference changes later', async ({ page }) => {
  await recordAnimations(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page);
  await mascot(page).scrollIntoViewIfNeeded();
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'static');
  expect(await count(page)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(300);
  expect(await count(page)).toBe(0);
  expect(await active(page)).toBe(0);
});

test('switching to reduced motion immediately restores the original pose', async ({ page }) => {
  await recordAnimations(page, true);
  await load(page); await trigger(page);
  await page.evaluate(() => { for (const a of window.__regAnimations) a.currentTime = 190; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'static');
  expect(await active(page)).toBe(0);
  for (const selector of ['[data-reg-eye]', '[data-reg-arm]']) {
    expect(await mascot(page).locator(selector).evaluate(el => getComputedStyle(el).transform)).toBe('none');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(200);
  expect(await count(page)).toBe(2);
});

test('no second greeting after an internal legal-page round trip', async ({ page }) => {
  await recordAnimations(page);
  await load(page); await trigger(page);
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
  await page.locator('.footer-links').getByRole('link', { name: 'Termos de Serviço' }).click();
  await expect(page.locator('h1')).toHaveText('Termos de Serviço');
  await page.getByRole('link', { name: '← Voltar', exact: true }).click();
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
  await mascot(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect(await count(page)).toBe(2);
  expect(await active(page)).toBe(0);
});

test('animation resources are released on unmount, even mid-gesture', async ({ page }) => {
  await recordAnimations(page, true);
  await load(page); await trigger(page);
  await page.locator('.footer-links').getByRole('link', { name: 'Política de Privacidade' }).click();
  await expect(page.locator('h1')).toHaveText('Política de Privacidade');
  expect(await page.evaluate(() => window.__regAnimations.every(a => a.playState === 'idle'))).toBe(true);
  await page.getByRole('link', { name: '← Voltar', exact: true }).click();
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
  expect(await count(page)).toBe(2);
});

test('hidden document waits for visibility and stops if hidden during the gesture', async ({ page }) => {
  await recordAnimations(page, true);
  // Simulates the Page Visibility API, not a real operating-system tab switch.
  await page.addInitScript(() => {
    window.__documentVisible = false;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__documentVisible ? 'visible' : 'hidden' });
  });
  await load(page);
  await mascot(page).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  expect(await count(page)).toBe(0);
  await page.evaluate(() => { window.__documentVisible = true; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => count(page)).toBe(2);
  await page.evaluate(() => { window.__documentVisible = false; document.dispatchEvent(new Event('visibilitychange')); });
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
  expect(await active(page)).toBe(0);
});

for (const missing of ['IntersectionObserver', 'animate']) {
  test(`missing ${missing} keeps a usable, static page`, async ({ page }) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ missing }) => {
      if (missing === 'IntersectionObserver') window.IntersectionObserver = undefined;
      else Element.prototype.animate = undefined;
    }, { missing });
    await load(page);
    await expect(mascot(page)).toHaveAttribute('data-greeting', 'static');
    await expect(page.locator('.hero-copy .primary-cta')).toHaveAttribute('href', /^https:\/\/wa\.me\/5511920681100/);
    expect(errors).toEqual([]);
  });
}

test('partial animation failure does not hide the mascot or leave unhandled rejections', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await recordAnimations(page, true);
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function(frames, options) {
      if (options?.id === 'reg-greeting-wave') throw new Error('Controlled animation failure');
      return animate.call(this, frames, options);
    };
  });
  await load(page);
  await mascot(page).scrollIntoViewIfNeeded();
  await expect(mascot(page)).toHaveAttribute('data-greeting', 'static');
  await page.waitForTimeout(200);
  expect(await active(page)).toBe(0);
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`visual review ${width}px: original pose, blink and restrained wave fit their reserved space`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await recordAnimations(page, true);
    await load(page); await trigger(page);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    await page.evaluate(() => { for (const a of window.__regAnimations) a.currentTime = 0; });
    const first = await mascot(page).screenshot();
    for (const time of [0, 190, 350, 650, 999]) {
      await page.evaluate(time => { for (const a of window.__regAnimations) a.currentTime = time; }, time);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const geometry = await mascot(page).evaluate(el => {
        const root = el.getBoundingClientRect(), arm = el.querySelector('[data-reg-arm]').getBoundingClientRect();
        return { inside: arm.left >= root.left && arm.right <= root.right && arm.top >= root.top && arm.bottom <= root.bottom, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight };
      });
      expect(geometry.inside).toBe(true);
      expect(geometry.documentWidth).toBe(dimensions.width);
      expect(geometry.documentHeight).toBe(dimensions.height);
      if (time === 190) {
        const scale = await mascot(page).locator('[data-reg-eye]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).d);
        expect(scale).toBeCloseTo(0.08, 2);
      }
      await page.locator('.phone-stage').screenshot({ path: testInfo.outputPath(`greeting-${width}-${time}.png`) });
    }
    await page.evaluate(() => { for (const a of window.__regAnimations) a.finish(); });
    await expect(mascot(page)).toHaveAttribute('data-greeting', 'done');
    expect(await mascot(page).screenshot()).toEqual(first);
    expect(await active(page)).toBe(0);
    await page.locator('.phone-stage').screenshot({ path: testInfo.outputPath(`greeting-${width}-finished.png`) });
  });
}
