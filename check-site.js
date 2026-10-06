'use strict';
// Run: node check-site.js (start the local website on port 8201 first).
// Uses the already-installed Studio Electron/axe tools, never contacts a
// production endpoint, and never navigates to a checkout or submits an enquiry.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ROOT = __dirname;
const TOOLS = path.join(ROOT, '../PallettAI-Studio-src');
const BASE = process.env.PALLETTAI_TEST_URL || 'http://127.0.0.1:8201';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'tests must run locally');
if (!process.versions.electron) {
  const binary = require(require.resolve('electron', { paths: [TOOLS] }));
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = require('node:child_process').spawn(binary, [__filename], { env, stdio: 'inherit' });
  child.on('exit', code => process.exit(code === null ? 1 : code));
} else {
  const { app, BrowserWindow, session } = require('electron');
  app.setPath('userData', path.join(ROOT, 'test-results/chromium-profile'));
  const failures = [];
  let checks = 0;
  function check(name, condition, detail) {
    checks++;
    if (!condition) failures.push(name + ': ' + JSON.stringify(detail));
    console.log((condition ? '✓ ' : '✗ ') + name + (condition ? '' : ' ' + JSON.stringify(detail)));
  }
  app.whenReady().then(async () => {
    const audit = session.fromPartition('website-redesign-tests');
    audit.webRequest.onBeforeRequest((details, cb) => {
      const url = new URL(details.url);
      cb({ cancel: !['127.0.0.1', 'localhost'].includes(url.hostname) && !['data:', 'blob:'].includes(url.protocol) });
    });
    const win = new BrowserWindow({ show: false, width: 1440, height: 1000, webPreferences: { session: audit, nodeIntegration: false, contextIsolation: true, sandbox: true } });
    const errors = [];
    win.webContents.on('console-message', (_event, ...args) => {
      // Electron 44 emits a details object; older builds use positional fields.
      const d = args[0];
      if (d && typeof d === 'object' ? d.level === 'error' : args[0] === 3) {
        const message = d && typeof d === 'object' ? d.message : args[1];
        if (!/ERR_BLOCKED_BY_CLIENT|Content Security Policy|Refused to/.test(message || '')) errors.push(message);
      }
    });
    const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [TOOLS] }), 'utf8');
    const pages = ['index.html', 'pricing.html', 'downloads.html', 'portfolio.html', 'support.html', 'telegram.html', 'live.html', 'changelog.html', 'privacy.html', 'terms.html', 'thanks.html', '404.html', 'ref.html?code=AB12CD'];
    try {
      for (const page of pages) {
        for (const width of [320, 360, 768, 1440]) {
          win.setContentSize(width, 1000);
          await win.loadURL(BASE + '/' + page);
          await win.webContents.executeJavaScript('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 100)))');
          const geometry = await win.webContents.executeJavaScript(`(() => {
            const nodes = [...document.querySelectorAll('main *')].filter(el => !el.closest('[hidden], .sr, .sprite, .cmp-wrap, .tbl-wrap') && !(el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') && getComputedStyle(el).display !== 'none');
            const outside = nodes.filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 2 || r.left < -2); }).map(el => ({tag:el.tagName, cls:el.className, text:el.textContent.slice(0,45)})).slice(0,6);
            return {width:innerWidth,scroll:document.documentElement.scrollWidth,outside,nav:!!document.querySelector('#navlinks a, .logo'),broken:[...document.images].filter(i => i.src.startsWith(location.origin) && i.complete && i.naturalWidth === 0).map(i => i.src)};
          })()`);
          check(page + ' fits ' + width + 'px', geometry.scroll <= geometry.width + 2 && !geometry.outside.length, geometry);
          check(page + ' local images load at ' + width + 'px', !geometry.broken.length, geometry.broken);
          check(page + ' navigation exists', geometry.nav, geometry);
          if (width === 360 || width === 1440) {
            await win.webContents.executeJavaScript(axe);
            const result = await win.webContents.executeJavaScript(`axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r => r.violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n => ({target:n.target,summary:n.failureSummary}))})))`);
            check(page + ' WCAG A/AA automated checks at ' + width + 'px', result.length === 0, result);
          }
        }
      }
      win.setContentSize(360, 850);
      await win.loadURL(BASE + '/');
      const menu = await win.webContents.executeJavaScript(`(() => { const b=document.querySelector('#burger');b.click();const opened=b.getAttribute('aria-expanded')==='true'&&getComputedStyle(document.querySelector('#navlinks')).display!=='none';document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return {opened,closed:b.getAttribute('aria-expanded')==='false',focus:document.activeElement===b};})()`);
      check('Mobile menu opens, Escape closes and restores focus', menu.opened && menu.closed && menu.focus, menu);
      await win.loadURL(BASE + '/pricing.html');
      const billing = await win.webContents.executeJavaScript(`(() => {const sw=document.querySelector('#billing-switch'), buttons=[...document.querySelectorAll('.tier .btn[data-monthly]')], before=buttons.map(b=>b.href);sw.click();const annual=buttons.map(b=>({href:b.href,label:b.textContent})),amounts=[...document.querySelectorAll('.tier .amt')].map(x=>x.textContent),notes=[...document.querySelectorAll('.annual-note')].map(x=>x.textContent),checked=sw.getAttribute('aria-checked');sw.click();return {before,annual,amounts,notes,checked,restored:buttons.every((b,i)=>b.href===before[i]),state:[...document.querySelectorAll('[data-pay]')].every(a=>a.dataset.payState==='ready')};})()`);
      check('All deposit, balance and care links resolve', billing.state, billing);
      check('Annual billing changes product, amount and one-time label', billing.checked === 'true' && billing.amounts.join('|') === '£15|£39|£79' && billing.annual.every((b,i) => b.href !== billing.before[i] && !/Subscribe/.test(b.label)) && billing.notes.join('|').includes('£948'), billing);
      check('Monthly checkout URLs restore correctly', billing.restored, billing);
      await win.loadURL(BASE + '/');
      const formInvalid = await win.webContents.executeJavaScript(`document.querySelector('#contact-form').checkValidity()`);
      check('Empty enquiry uses browser required-field validation', !formInvalid, formInvalid);
      const plannerMatrix = await win.webContents.executeJavaScript(`(() => {
        const results=[];
        for(const start of ['new','refresh','custom']) for(const scope of ['one','pages','booking']) for(const goal of ['enquiries','brand','clarity']) {
          for(const [id,value] of [['plan-start',start],['plan-scope',scope],['plan-goal',goal]]) { const el=document.getElementById(id);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true})); }
          const custom=start==='custom'||scope!=='one';
          const expected=custom?'£349':start==='refresh'?'£149':'£249';
          const deposit=custom?'£149 deposit':start==='refresh'?'£49 deposit':'£99 deposit';
          results.push({start,scope,goal,ok:document.getElementById('plan-price').textContent===expected&&document.getElementById('plan-deposit').textContent.includes(deposit)&&document.getElementById('plan-focus').textContent.includes(document.getElementById('plan-goal').selectedOptions[0].text.toLowerCase()),map:document.getElementById('plan-map').textContent});
        }
        return results;
      })()`);
      check('All 27 planner combinations use correct package, deposit and focus', plannerMatrix.length===27 && plannerMatrix.every(r=>r.ok), plannerMatrix.filter(r=>!r.ok));
      check('Planner maps connected workflows rather than promising a standard site', plannerMatrix.filter(r=>r.scope==='booking'&&r.start!=='custom').every(r=>r.map.includes('Booking / workflow'))&&plannerMatrix.filter(r=>r.start==='custom').every(r=>r.map.includes('Outcome')), plannerMatrix);
      const handoff = await win.webContents.executeJavaScript(`(() => {
        const details=document.getElementById('cf-details'),button=document.getElementById('plan-handoff');
        details.value='Please keep my own notes.';button.click();button.click();
        const repeated=details.value,focused=document.activeElement===details;
        const start=document.getElementById('plan-start'),scope=document.getElementById('plan-scope');start.value='refresh';scope.value='one';scope.dispatchEvent(new Event('change',{bubbles:true}));button.click();
        return {repeated,focused,updated:details.value,visible:!document.getElementById('project-planner').hidden};
      })()`);
      check('Planner handoff preserves notes, avoids duplicates and focuses enquiry', handoff.visible&&handoff.focused&&handoff.repeated.startsWith('Please keep my own notes.')&&handoff.repeated.split('Project planner outline').length===2&&handoff.updated.includes('Website redesign — from £149')&&!handoff.updated.includes('Something custom —'), handoff);
      const fixture = { score: 72, band: 'Room to improve', categories: { Speed: {got:18,max:25}, Mobile:{got:20,max:25}, Search:{got:15,max:25}, Security:{got:19,max:25} }, checks: [{id:'viewport',label:'Mobile viewport',status:'pass',detail:'Configured.'},{id:'title',label:'Page title',status:'warn',detail:'Too short.',fix:'Write a descriptive title.'}] };
      await win.webContents.executeJavaScript(`window.__testRequests=[];window.fetch=async (url,options)=>{window.__testRequests.push({url:String(url),method:options&&options.method});if(String(url).includes('/grade?'))return new Response(JSON.stringify(${JSON.stringify(fixture)}),{status:200});if(String(url).includes('formspree.io'))return new Response('{}',{status:window.__failForm?500:200});throw new Error('Unexpected network request');};document.querySelector('#check-url').value='not-a-url';document.querySelector('#check-form').requestSubmit();`);
      check('Checker rejects invalid address without network', await win.webContents.executeJavaScript(`document.querySelector('#check-status').classList.contains('err')&&window.__testRequests.length===0`));
      await win.webContents.executeJavaScript(`document.querySelector('#check-url').value='example.com';document.querySelector('#vs-toggle').click();document.querySelector('#check-rival').value='competitor.example';document.querySelector('#check-form').requestSubmit();`);
      await new Promise(r => setTimeout(r, 200));
      const checker = await win.webContents.executeJavaScript(`({score:document.querySelector('#g-score').textContent,visible:!document.querySelector('#check-out').hidden,compare:!document.querySelector('#check-compare').hidden,tools:!document.querySelector('#check-tools').hidden,project:!document.querySelector('#next-project').hidden,accessible:!document.querySelector('#g-score').closest('[aria-hidden="true"]'),busy:document.querySelector('#check-form button').disabled})`);
      check('Checker comparison, score, tools and project handoff render', checker.score === '72' && checker.visible && checker.compare && checker.tools && checker.project && checker.accessible && !checker.busy, checker);
      await win.webContents.executeJavaScript(axe);
      const reportA11y = await win.webContents.executeJavaScript(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))`);
      check('Visible checker results pass automated accessibility', !reportA11y.length, reportA11y);
      for (const fail of [false, true]) {
        await win.webContents.executeJavaScript(`window.__failForm=${fail};document.querySelector('#cf-name').value='Local test';document.querySelector('#cf-email').value='local@example.invalid';document.querySelector('#cf-details').value='Local regression fixture, not sent.';document.querySelector('#contact-form').requestSubmit();`);
        await new Promise(r => setTimeout(r, 100));
        const state = await win.webContents.executeJavaScript(`({status:document.querySelector('#contact-form .status').className,message:document.querySelector('#contact-form .status').textContent,disabled:document.querySelector('#contact-form button').disabled,label:document.querySelector('#contact-form button').textContent,details:document.querySelector('#cf-details').value})`);
        check('Enquiry ' + (fail ? 'error retains message' : 'success resets fields') + ' and restores button', state.status.includes(fail ? 'err' : 'ok') && !state.disabled && state.label.includes('Let’s talk') && (fail ? state.details.length > 0 : state.details === '' && state.message.includes('24 hours')), state);
      }
      await win.loadURL(BASE + '/');
      await win.webContents.debugger.attach('1.3');
      await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
      await win.reload();
      await new Promise(r => setTimeout(r, 200));
      const reduced = await win.webContents.executeJavaScript(`({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,hidden:[...document.querySelectorAll('h1,h2,.build-card')].filter(el=>getComputedStyle(el).opacity==='0').length,loops:document.getAnimations().filter(a=>a.playState==='running').length})`);
      check('Reduced motion shows all content without animation loops', reduced.matches && reduced.hidden === 0 && reduced.loops === 0, reduced);
      win.webContents.debugger.detach();
      const staticWin = new BrowserWindow({show:false,width:390,height:844,webPreferences:{session:audit,javascript:false,nodeIntegration:false,contextIsolation:true,sandbox:true}});
      for (const page of ['index.html','pricing.html']) {
        await staticWin.loadURL(BASE + '/' + page);
        const source = fs.readFileSync(path.join(ROOT,page),'utf8');
        if(page==='index.html') check('Planner has a no-JavaScript pricing and contact alternative', /<noscript>[\s\S]*?website packages and starting prices[\s\S]*?tell us about your project/.test(source));
        check(page + ' provides static navigation, content and email checkout fallback', /<header class="nav"[\s\S]*?<nav/.test(source) && /href="support.html"/.test(source) && /<h1/.test(source));
      }
      staticWin.destroy();
      for (const page of pages) {
        await win.loadURL(BASE + '/' + page);
        const links = await win.webContents.executeJavaScript(`(() => {const missing=[];for(const a of document.querySelectorAll('a[href]')){const u=new URL(a.href);if(u.origin===location.origin && u.hash && u.pathname===location.pathname && !document.getElementById(decodeURIComponent(u.hash.slice(1))))missing.push(u.href)}return missing;})()`);
        check(page + ' internal section links exist', links.length === 0, links);
      }
      const staticAssets = [];
      for (const file of pages.map(p => p.split('?')[0])) {
        const html = fs.readFileSync(path.join(ROOT,file),'utf8');
        for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
          const u = new URL(match[1], BASE + '/' + file);
          if (u.origin !== new URL(BASE).origin) continue;
          const local = path.join(ROOT, decodeURIComponent(u.pathname));
          if (!fs.existsSync(local)) staticAssets.push(file + ' → ' + u.pathname);
          else if (u.hash && /\.html$/.test(local) && !fs.readFileSync(local,'utf8').includes('id="'+decodeURIComponent(u.hash.slice(1))+'"')) staticAssets.push(file + ' → missing ' + u.pathname + u.hash);
        }
        check(file + ' retains valid structured data', [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].every(m=>{try{JSON.parse(m[1]);return true}catch{return false}}));
      }
      check('Production page assets and cross-page anchors exist', staticAssets.length === 0, staticAssets);
      check('No unexpected JavaScript errors', errors.length === 0, errors);
      fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'test-results/redesign-checks.json'), JSON.stringify({ checks, failures }, null, 2));
      console.log('\n' + checks + ' checks; ' + failures.length + ' failures. No production requests sent.');
      app.exit(failures.length ? 1 : 0);
    } catch (error) { console.error(error); app.exit(1); }
  });
}
