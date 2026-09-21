import { test, expect } from '@playwright/test';

const widths = [320,360,390,414,559,560,680,767,768,920,1024,1099,1100,1280,1440,1920];
const expectedPhone = '5511920681100';
const nav = page => page.getByRole('navigation', { name: 'Navegação principal' });

async function openHome(page) {
  await page.goto('/');
  await expect(page.locator('.phone')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function verifyLayout(page) {
  const m = await page.evaluate(() => {
    const bounds = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left:r.left,right:r.right,top:r.top,bottom:r.bottom }; };
    const overlaps = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
    const phone = bounds('.phone'), note = bounds('.whatsapp-note');
    const overflow = [];
    for (const selector of ['.desktop-nav','.hero-copy','.hero-badge','.phone','.hero-mascot','.mascot-message','.whatsapp-note','.demo-disclaimer','.plan-heading','.plan-badge','.price-setup','.price-monthly','.primary-cta','.footer-links','.company-details']) {
      for (const element of document.querySelectorAll(selector)) {
        const r=element.getBoundingClientRect();
        if(r.width && (r.left < -1 || r.right > innerWidth+1)) overflow.push(selector);
      }
    }
    return {overflow,viewport:innerWidth,width:document.documentElement.scrollWidth,noteGap:note.top-phone.bottom,overlap:overlaps(phone,note)||overlaps(phone,bounds('.mascot-cluster'))||overlaps(phone,bounds('.hero-copy')),lastMessageInside:bounds('.bubble:last-child').bottom < bounds('.phone-screen').bottom};
  });
  expect(m.overflow).toEqual([]);
  expect(m.width).toBeLessThanOrEqual(m.viewport+1);
  expect(m.noteGap).toBeGreaterThanOrEqual(8);
  expect(m.overlap).toBe(false);
  expect(m.lastMessageInside).toBe(true);
  const caption=page.locator('.whatsapp-note span');
  await caption.scrollIntoViewIfNeeded();
  expect(await caption.evaluate(el => { const r=el.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); return hit===el||el.contains(hit); })).toBe(true);
}
for (const width of widths) {
  test(`layout ${width}px: caption, prices and company data stay readable`, async ({page},testInfo) => {
    await page.setViewportSize({width,height:900});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await openHome(page); await verifyLayout(page);
    await expect(nav(page).getByRole('button',{name:'Planos',exact:true})).toBeVisible();
    expect(errors).toEqual([]);
    if([390,768,1100,1440].includes(width)) {
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.screenshot({path:testInfo.outputPath(`site-${width}.png`),fullPage:true});
    }
  });
}
for (const width of [390,1440]) {
  test(`navigation ${width}px: sections stay in place`, async ({page}) => {
    await page.setViewportSize({width,height:900}); await openHome(page);
    for(const [label,id] of [['Como funciona','como-funciona'],['Planos','planos'],['Dúvidas','duvidas']]) {
      await page.getByRole('button',{name:'Voltar ao início',exact:true}).click();
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(5);
      await nav(page).getByRole('button',{name:label,exact:true}).click();
      await expect.poll(()=>page.locator(`#${id}`).evaluate(el=>el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(20);
      await expect.poll(()=>page.locator(`#${id}`).evaluate(el=>el.getBoundingClientRect().top)).toBeLessThanOrEqual(28);
      const position=await page.evaluate(()=>scrollY); await page.waitForTimeout(1200);
      expect(Math.abs(await page.evaluate(()=>scrollY)-position)).toBeLessThan(2);
    }
  });
  test(`all sales CTAs ${width}px open the approved WhatsApp destination`, async ({page,context}) => {
    await page.setViewportSize({width,height:900});
    // Validate click/pop-up routing without contacting WhatsApp or sending messages.
    await context.route('https://wa.me/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<p>Destination intercepted by test. No message sent.</p>'}));
    await openHome(page);
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    await expect(page.locator('.is-disabled')).toHaveCount(0);
    await expect(page.locator('#whatsapp-availability')).toHaveCount(0);
    const ctas=page.locator('.primary-cta'); expect(await ctas.count()).toBe(6);
    let clicked=0;
    for(const cta of await ctas.all()) {
      await expect(cta).toHaveAccessibleName('Falar com a Reg');
      await expect(cta).toHaveAttribute('target','_blank');
      const href=new URL(await cta.getAttribute('href'));
      expect(href.origin).toBe('https://wa.me'); expect(href.pathname).toBe('/'+expectedPhone);
      expect(href.searchParams.get('text')).toContain('Oi, Reg.');
      if(!await cta.isVisible()) continue;
      await cta.scrollIntoViewIfNeeded();
      const [popup]=await Promise.all([page.waitForEvent('popup'),cta.click()]);
      await popup.waitForLoadState('domcontentloaded');
      expect(new URL(popup.url()).pathname).toBe('/'+expectedPhone);
      await popup.close(); clicked++;
    }
    expect(clicked).toBe(width<1100 ? 5 : 6);
  });
}
test('mobile FAQ supports keyboard and stays open', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await openHome(page);
  const summary=page.locator('.faq-list summary').first(); await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first()).toHaveAttribute('open','');
  await expect(page.locator('.faq-list details p').first()).toBeVisible();
  await page.waitForTimeout(600); await expect(page.locator('.faq-list details').first()).toHaveAttribute('open','');
  await page.keyboard.press('Enter'); await expect(page.locator('.faq-list details').first()).not.toHaveAttribute('open','');
});
test('privacy and terms are complete and start at top after footer navigation', async ({page},testInfo) => {
  await page.setViewportSize({width:390,height:844}); await openHome(page);
  for(const [label,path] of [['Política de Privacidade','/politica-de-privacidade'],['Termos de Serviço','/termos-de-uso']]) {
    await page.locator('.footer-links').getByRole('link',{name:label,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(path+'$'));
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(5);
    await expect(page.locator('.legal-header svg')).toHaveAttribute('viewBox','0 0 240 260');
    const text=await page.locator('article').innerText();
    expect(text).not.toMatch(/preliminar|ambiente de desenvolvimento|serão incluídos|versão final será|\[CNPJ\]/i);
    expect(text).toContain('Registreai Marcas e Patentes LTDA'); expect(text).toContain('59.197.668/0001-13');
    expect(text).toContain('Rua Itapura, 975 - Vila Gomes Cardim'); expect(text).toContain('03310-000');
    expect(text).toContain('ola@registreai.com.br'); expect(text).toContain('(11) 92068-1100');
    expect(await page.locator('.legal-content h2').count()).toBeGreaterThanOrEqual(8);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(path.slice(1)+'.png'),fullPage:true});
    await page.getByRole('link',{name:'← Voltar',exact:true}).click();
    await expect(page.locator('.hero h1')).toBeVisible();
  }
});
test('company identity and legal contact match owner-approved data', async ({page}) => {
  await openHome(page); const footer=page.locator('footer');
  await expect(footer).toContainText('Registreai Marcas e Patentes LTDA');
  await expect(footer).toContainText('59.197.668/0001-13'); await expect(footer).toContainText('Rua Itapura, 975 - Vila Gomes Cardim');
  await expect(footer).toContainText('São Paulo - SP'); await expect(footer).toContainText('03310-000');
  await expect(footer.locator('a[href="mailto:ola@registreai.com.br"]')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText('CNPJ ativo');
  await expect(page.locator('body')).not.toContainText('WhatsApp em configuração');
});
test('Proteção is highlighted and approved prices stay unchanged', async ({page}) => {
  await openHome(page);
  const primary=page.locator('[data-plan="protection"]'), secondary=page.locator('[data-plan="unlimited"]');
  await expect(primary).toHaveClass(/recommended/); await expect(secondary).toHaveClass(/secondary/);
  await expect(primary.locator('.plan-badge')).toHaveText('MAIS POPULAR');
  await expect(primary.locator('.price-setup strong')).toHaveText('R$ 197'); await expect(primary.locator('.price-monthly strong')).toHaveText('+ R$ 49');
  await expect(secondary.locator('.price-setup strong')).toHaveText('R$ 497'); await expect(secondary.locator('.price-monthly strong')).toHaveText('+ R$ 599');
  expect(await secondary.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await primary.evaluate(el=>getComputedStyle(el).borderTopWidth)).toBe('2px');
});
test('demo reaches protocol but never impersonates a real process', async ({page}) => {
  await openHome(page);
  await expect(page.locator('.chat-head')).toContainText('Conversa ilustrativa');
  await expect(page.locator('.viability-bubble')).toContainText('Viabilidade aprovada na análise');
  await expect(page.locator('.protocol-bubble')).toContainText('Pedido protocolado no INPI em seu nome.');
  await expect(page.locator('.demo-process-number')).toContainText('000.000.000');
  await expect(page.locator('.demo-process-number')).toContainText('Número fictício');
  await expect(page.locator('.demo-disclaimer')).toContainText('sem processo real');
  await expect(page.locator('.protocol-bubble a')).toHaveCount(0);
});
test('fallback fonts and reduced motion keep the caption readable', async ({page}) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
  await page.emulateMedia({reducedMotion:'reduce'}); await page.setViewportSize({width:320,height:800});
  await openHome(page); await verifyLayout(page);
  await nav(page).getByRole('button',{name:'Planos',exact:true}).click();
  await expect.poll(()=>page.locator('#planos').evaluate(el=>el.getBoundingClientRect().top)).toBeLessThanOrEqual(28);
});
test('200 percent text reflows without hidden content', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await openHome(page);
  await page.evaluate(()=>{for(const el of document.querySelectorAll('h1,h2,h3,p,button,a,summary,.bubble,.mascot-message,.whatsapp-note'))el.style.fontSize=`${parseFloat(getComputedStyle(el).fontSize)*2}px`;});
  await verifyLayout(page);
});
