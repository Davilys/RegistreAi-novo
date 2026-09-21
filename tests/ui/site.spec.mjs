import { test, expect } from '@playwright/test';

const widths = [320, 360, 390, 414, 559, 560, 680, 767, 768, 920, 1024, 1099, 1100, 1280, 1440, 1920];

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('.phone')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function verifyLayout(page) {
  const measurements = await page.evaluate(() => {
    const bounds = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const phone = bounds('.phone');
    const note = bounds('.whatsapp-note');
    const mascot = bounds('.mascot-cluster');
    const copy = bounds('.hero-copy');
    const overflow = [];
    for (const selector of ['.desktop-nav', '.hero-copy', '.hero-badge', '.phone', '.hero-mascot', '.mascot-message', '.whatsapp-note', '.plan-heading', '.plan-badge', '.price-setup', '.price-monthly', '.primary-cta', '.footer-links']) {
      for (const element of document.querySelectorAll(selector)) {
        const r = element.getBoundingClientRect();
        if (r.width && (r.left < -1 || r.right > innerWidth + 1)) overflow.push(selector);
      }
    }
    return {
      overflow, viewport: innerWidth, width: document.documentElement.scrollWidth,
      noteGap: note.top - phone.bottom,
      overlap: overlaps(phone, note) || overlaps(phone, mascot) || overlaps(phone, copy),
      lastMessageInside: bounds('.bubble:last-child').bottom < bounds('.phone-screen').bottom,
    };
  });
  expect(measurements.overflow).toEqual([]);
  expect(measurements.width).toBeLessThanOrEqual(measurements.viewport + 1);
  expect(measurements.noteGap).toBeGreaterThanOrEqual(8);
  expect(measurements.overlap).toBe(false);
  expect(measurements.lastMessageInside).toBe(true);
  const caption = page.locator('.whatsapp-note span');
  await caption.scrollIntoViewIfNeeded();
  expect(await caption.evaluate(element => {
    const r = element.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit === element || element.contains(hit);
  })).toBe(true);
}

for (const width of widths) {
  test(`layout ${width}px: no clipped text or phone overlap`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await openHome(page);
    await verifyLayout(page);
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Planos', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    if ([390, 768, 1100, 1440].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`site-${width}.png`), fullPage: true });
    }
  });
}

for (const width of [390, 1440]) {
  test(`navigation ${width}px: each section stays in place`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    for (const [label, id] of [['Como funciona', 'como-funciona'], ['Planos', 'planos'], ['Dúvidas', 'duvidas']]) {
      await page.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
      await page.getByRole('navigation').getByRole('button', { name: label, exact: true }).click();
      await expect.poll(() => page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(20);
      await expect.poll(() => page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top)).toBeLessThanOrEqual(28);
      const position = await page.evaluate(() => scrollY);
      await page.waitForTimeout(1200);
      expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThan(2);
    }
  });
}

test('mobile FAQ supports keyboard and stays open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const summary = page.locator('.faq-list summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await expect(page.locator('.faq-list details p').first()).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open', '');
});

test('privacy and terms start at the top after footer navigation', async ({ page }) => {
  await openHome(page);
  for (const [label, path] of [['Política de Privacidade', '/politica-de-privacidade'], ['Termos de Serviço', '/termos-de-uso']]) {
    await page.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(path + '$'));
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    await expect(page.locator('.legal-header svg')).toHaveAttribute('viewBox', '0 0 240 260');
    await page.getByRole('link', { name: '← Voltar', exact: true }).click();
    await expect(page.locator('.hero h1')).toBeVisible();
  }
});

test('missing WhatsApp configuration is visibly explained, no dead # link', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('#whatsapp-availability')).toBeVisible();
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  for (const button of await page.locator('.primary-cta').all()) await expect(button).toBeDisabled();
});

test('fallback fonts and reduced motion keep the full caption readable', async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 800 });
  await openHome(page);
  await verifyLayout(page);
  await page.getByRole('button', { name: 'Planos', exact: true }).click();
  await expect.poll(() => page.locator('#planos').evaluate(el => el.getBoundingClientRect().top)).toBeLessThanOrEqual(28);
});

test('text at 200 percent reflows instead of hiding behind illustration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('h1,h2,h3,p,button,a,summary,.bubble,.mascot-message,.whatsapp-note')) {
      el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`;
    }
  });
  // At increased text size, the phone and caption must still take up independent rows.
  await verifyLayout(page);
});


test('approved commercial content is present without changing the hero identity', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('.hero h1')).toHaveText('A IA que registra sua marca.');
  await expect(page.getByRole('heading', { name: 'Sim, é de verdade. E a marca fica no seu nome.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fazer sozinho sai caro.' })).toBeVisible();
  await expect(page.locator('#planos')).toContainText('R$ 197');
  await expect(page.locator('#planos')).toContainText('R$ 497');
  await expect(page.locator('#planos')).toContainText('R$ 49');
  await expect(page.locator('#planos')).toContainText('R$ 599');
  await expect(page.locator('#planos')).toContainText('MAIS POPULAR');
  await expect(page.locator('.faq-list details')).toHaveCount(6);
  for (const question of ['É golpe?', 'A IA erra?', 'E se o INPI negar?', 'Preciso ter CNPJ?', 'Posso cancelar quando quiser?', 'Quanto tempo demora?']) {
    await expect(page.locator('.faq-list summary', { hasText: question })).toBeVisible();
  }
});
