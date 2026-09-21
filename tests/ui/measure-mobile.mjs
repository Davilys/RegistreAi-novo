import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

// Compare real Vite production builds using identical fonts/viewport settings.
const [beforeDir,afterDir,output='test-results/mobile-comparison.json']=process.argv.slice(2);
if(!beforeDir||!afterDir) throw new Error('Usage: node measure-mobile.mjs BEFORE_DIST AFTER_DIST OUTPUT');
const servers=[];
async function serve(dir) {
  const root=resolve(dir);
  const server=createServer(async(req,res)=>{
    try {
      const pathname=new URL(req.url,'http://localhost').pathname;
      const file=resolve(root,'.'+pathname);
      if(file!==root&&!file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
      const requested=pathname==='/'?resolve(root,'index.html'):file;
      const bytes=await readFile(requested);
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'}[extname(requested)]||'application/octet-stream';
      res.writeHead(200,{'content-type':mime});res.end(bytes);
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r)); servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
let browser;
try {
  const beforeURL=await serve(beforeDir), afterURL=await serve(afterDir);
  browser=await chromium.launch(); const measurements=[];
  for(const width of [360,390,414]) {
    const context=await browser.newContext({viewport:{width,height:844},locale:'pt-BR'});
    await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,r=>r.abort());
    const page=await context.newPage();
    await page.goto(beforeURL); await page.locator('.phone').waitFor(); await page.evaluate(()=>document.fonts.ready);
    const before=await page.evaluate(()=>document.documentElement.scrollHeight);
    await page.goto(afterURL); await page.locator('.phone').waitFor(); await page.evaluate(()=>document.fonts.ready);
    const after=await page.evaluate(()=>document.documentElement.scrollHeight);
    measurements.push({width,before,after,reductionPercent:Number(((1-after/before)*100).toFixed(2))});
    await context.close();
  }
  await mkdir('test-results',{recursive:true});
  await writeFile(output,JSON.stringify({baselineCommit:'cada12093b38ccc233fcface7a7e1550b106363a',fonts:'identical fallback fonts',measurements},null,2));
  console.log('MOBILE_COMPARISON '+JSON.stringify(measurements));
  if(measurements.some(m=>m.reductionPercent<15)) throw new Error('Mobile height reduction below 15%; review layout before publishing.');
} finally {
  if(browser)await browser.close();
  for(const server of servers)await new Promise(r=>server.close(r));
}
