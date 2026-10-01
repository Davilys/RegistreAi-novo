import { test, expect } from '@playwright/test';
const widths=[320,360,390,430,559,560,680,767,768,920,1024,1099,1100,1280,1440,1920];
async function home(page,width=390) { await page.setViewportSize({width,height:844}); await page.goto('/'); await page.evaluate(()=>document.fonts.ready); }
async function reflow(page) { expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true); }
for(const width of widths) test(`marketing layout ${width}`,async({page},info)=>{
 let errors=[];page.on('pageerror',e=>errors.push(e.message));await home(page,width);await reflow(page);
 await expect(page.locator('.hero h1')).toBeVisible();
 await expect(page.locator('.chat-body > .bubble')).toHaveCount(3);
 for(const selector of ['.hero-copy','.conversation-panel','.demo-disclaimer','.plan-card','.company-details']) {
  expect(await page.locator(selector).evaluateAll(els=>els.every(el=>{let r=el.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1}))).toBe(true);
 }
 if(width<768){expect(await page.locator('.topbar').evaluate(el=>el.getBoundingClientRect().height)).toBe(64);await expect(page.locator('.menu-toggle')).toBeVisible();await expect(page.locator('.plan-details ul').first()).not.toBeVisible();}
 for(const plan of ['protection','unlimited']) await expect(page.locator(`[data-plan="${plan}"] .inpi-fee`)).toHaveText('Taxas oficiais do INPI à parte.');
 expect(errors).toEqual([]);
 if([360,390,430,768,1440].includes(width)) await page.screenshot({path:info.outputPath(`after-${width}.png`),fullPage:true});
});
for(const width of [390,1440]) test(`interactions and disclosures ${width}`,async({page},info)=>{
 await home(page,width);await page.emulateMedia({reducedMotion:'reduce'});
 for(const [label,id] of [['Como funciona','como-funciona'],['Planos','planos'],['Dúvidas','duvidas']]){
  await page.getByRole('button',{name:'Voltar ao início'}).click();
  if(width<768)await page.locator('.menu-toggle').click();
  await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('button',{name:label,exact:true}).click();
  await expect.poll(()=>page.locator(`#${id}`).evaluate(el=>Math.abs(el.getBoundingClientRect().top-24))).toBeLessThan(2);
 }
 for(const summary of await page.locator('.faq-list summary').all()){await summary.focus();await page.keyboard.press('Enter');await expect(summary.locator('..')).toHaveAttribute('open','');await reflow(page);await page.keyboard.press('Enter');}
 if(width<768) for(const d of await page.locator('.plan-details').all()){await d.locator('summary').focus();await page.keyboard.press('Enter');await expect(d.locator('ul')).toBeVisible();await reflow(page);await page.keyboard.press('Enter');}
 await page.locator('.conversation-toggle').click();await expect(page.locator('.protocol-bubble')).toContainText('Pedido protocolado no INPI em seu nome.');await reflow(page);
 await page.locator('.conversation-toggle').click();await expect(page.locator('.demo-disclaimer')).toContainText('sem garantia de deferimento');await expect(page.locator('.demo-process-number')).toContainText('Número fictício');
 await page.evaluate(()=>scrollTo(0,0));if(width<768)await page.locator('.menu-toggle').click();
 await page.screenshot({path:info.outputPath(`states-${width}.png`),fullPage:true});
});
test('unchanged business data, plan values and legal copy',async({page})=>{
 await home(page);for(const [plan,setup,monthly] of [['protection','197','49'],['unlimited','497','599']]){
  await expect(page.locator(`[data-plan="${plan}"] .price-setup strong`)).toHaveText(`R$ ${setup}`);
  await expect(page.locator(`[data-plan="${plan}"] .price-monthly strong`)).toHaveText(`+ R$ ${monthly}`);
 }
 await expect(page.locator('body')).toContainText('59.197.668/0001-13');await expect(page.locator('body')).toContainText('Rua Itapura, 975');
 await expect(page.locator('.plan-badge')).toHaveCount(0);await expect(page.locator('footer .primary-cta')).toHaveCount(0);
 for(const a of await page.locator('.primary-cta').all()) await expect(a).toHaveAttribute('href','https://wa.me/5511920681100?text=Oi%2C%20Reg.%20Quero%20conhecer%20os%20planos%20para%20registrar%20minha%20marca.');
});
test('200 percent text and fallback font reflow',async({page},info)=>{
 await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());await home(page,390);await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{for(const el of document.querySelectorAll('h1,h2,h3,p,button,a,summary,.bubble,.chat-head small,.price strong,.price span'))el.style.fontSize=`${parseFloat(getComputedStyle(el).fontSize)*2}px`;});
 await reflow(page);await page.locator('.conversation-toggle').click();await reflow(page);await page.locator('.plan-details summary').first().click();await reflow(page);
 await page.screenshot({path:info.outputPath('zoom-200.png'),fullPage:true});
});
