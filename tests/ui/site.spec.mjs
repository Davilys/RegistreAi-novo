import { test, expect } from '@playwright/test';
async function openHome(page) { await page.goto('/'); await page.evaluate(() => document.fonts.ready); }
test('privacy and terms are complete and start at top after footer navigation', async ({page},testInfo) => {
  await page.setViewportSize({width:390,height:844}); await openHome(page);
  for(const [label,path] of [['Política de Privacidade','/politica-de-privacidade'],['Termos de Serviço','/termos-de-uso']]) {
    await page.locator('.footer-links').getByRole('link',{name:label,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(path+'$'));
    await expect(page.locator('h1')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(5);
    await expect(page.locator('.legal-header svg')).toHaveAttribute('viewBox','0 0 240 260');
    const text=await page.locator('article').innerText();
    // "Procedimentos preliminares" is a lawful purpose, not a development disclaimer.
    expect(text).not.toMatch(/versão preliminar|texto preliminar|ambiente de desenvolvimento|serão incluídos|versão final será|\[CNPJ\]/i);
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
