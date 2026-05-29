'use strict';

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const ROOT   = path.resolve(__dirname, '..');
const DATA   = path.join(ROOT, 'Data');
const RESUME = path.join(ROOT, 'Resume');

// ─ Clean up previous PDFs ─────────────────────────────────────────────────────

function cleanPDFs() {
  for (const f of fs.readdirSync(RESUME)) {
    if (f.endsWith('.pdf')) {
      fs.unlinkSync(path.join(RESUME, f));
      console.log(`[pdf] deleted → ${f}`);
    }
  }
}

// ── Data ───────────────────────────────────────────────────────────────────────

function loadData() {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'projects.json'), 'utf8'));
  const entries  = manifest.projects.map(slug => {
    try { return { ...JSON.parse(fs.readFileSync(path.join(DATA, slug, 'project.json'), 'utf8')), slug }; }
    catch { return null; }
  }).filter(Boolean);
  return { profile: manifest.profile, skills: manifest.skills, entries };
}

function imgURI(slug, imgPath) {
  try {
    const buf = fs.readFileSync(path.join(DATA, slug, imgPath));
    const ext = path.extname(imgPath).slice(1).replace('jpg', 'jpeg');
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// ── HTML builders ──────────────────────────────────────────────────────────────

function sectionImgs(slug, images, dir) {
  if (!images || !images.length) return '';
  const slots = images.map(p => {
    const uri = imgURI(slug, p);
    return uri ? `<div class="img-slot"><img src="${uri}"></div>` : '';
  }).filter(Boolean).join('');
  if (!slots) return '';
  return `<div class="si ${dir === 'row' ? 'si-row' : 'si-col'}">${slots}</div>`;
}

// bulletPt is applied as inline style on each <ul> so cards can have different sizes
function cardHTML(e, n, bulletPt = 11) {
  const cols = [
    { label:'WHAT?',   bullets:e.what,    imgs:e.what_images    ||[], dir:e.what_images_direction    ||'col' },
    { label:'HOW?',    bullets:e.how,     imgs:e.how_images     ||[], dir:e.how_images_direction     ||'col' },
    { label:'RESULTS', bullets:e.results, imgs:e.results_images ||[], dir:e.results_images_direction ||'col' },
  ];
  const li = arr => arr.map(b => `<li>${b}</li>`).join('');
  const ulStyle = `font-size:${bulletPt.toFixed(1)}pt`;
  return `<div class="ch">
    <span class="cn">${String(n).padStart(2,'0')}</span>
    <div class="ct"><div class="ctitle">${e.title}</div><div class="corg">${e.org} · ${e.institution}</div></div>
    <div class="cr"><span class="ctag">${e.category}</span><span class="cper">${e.period}</span></div>
  </div>
  ${cols.map(c => `<div class="sec">
    <div class="sec-label">${c.label}</div>
    <div class="sec-content">
      ${sectionImgs(e.slug, c.imgs, c.dir)}
      <ul style="${ulStyle}">${li(c.bullets)}</ul>
    </div>
  </div>`).join('')}`;
}

// ── CSS ────────────────────────────────────────────────────────────────────────
// All grays replaced with #0F172A (black). Blues (#60A5FA, #2563EB) retained.

function buildCSS(imgH = '2.2in') {
  return `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{
  background:#FFFFFF;color:#0F172A;
  font-family:'Space Grotesk',-apple-system,'Helvetica Neue',Arial,sans-serif;
  font-size:12pt;line-height:1.55;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}
ul{list-style:none}
img{display:block;width:100%;height:100%;object-fit:contain}

/* ── Cover ── */
.cover{
  height:10.05in;overflow:hidden;
  display:flex;flex-direction:column;
  page-break-after:always;break-after:page;
}

/* ── Cards ── */
.card{page-break-inside:avoid;break-inside:avoid;margin-bottom:0.25in}
.first-card{page-break-before:always;break-before:page;margin-top:0}

/* ── Identity ── */
.ident{flex-shrink:0;padding:20pt 0 14pt;border-bottom:1.5pt solid #60A5FA}
.iname{font-family:'Space Mono','Courier New',monospace;font-size:24pt;font-weight:700;letter-spacing:0.07em;color:#0F172A;margin-bottom:5pt}
.isub{font-size:12pt;font-weight:500;color:#0F172A;display:flex;align-items:center;gap:8pt;margin-bottom:4pt}
.ilinks{font-family:'Space Mono','Courier New',monospace;font-size:7pt;color:#60A5FA;letter-spacing:0.04em;display:flex;align-items:center;gap:9pt}
.dot{color:#0F172A}

/* ── Cover sections ── */
.p0-sec{flex-shrink:0;padding-top:12pt}
.sh{font-family:'Space Mono','Courier New',monospace;font-size:5.5pt;letter-spacing:0.24em;color:#60A5FA;border-bottom:1pt solid #E2E8F0;padding-bottom:4pt;margin-bottom:8pt}
.bio{font-size:12pt;line-height:1.75;color:#0F172A;margin-bottom:10pt;text-indent:1.5em}

/* ── Meta ── */
.meta{border-collapse:collapse;width:100%;table-layout:fixed;margin-top:-8pt}
.ml{font-family:'Space Mono','Courier New',monospace;font-size:5pt;letter-spacing:0.15em;color:#60A5FA;padding:2pt 16pt 2pt 0;white-space:nowrap;vertical-align:middle;width:80pt}
.mv{font-size:11pt;color:#0F172A;padding:2pt 0;vertical-align:top;width:200pt}

/* ── Skills ── */
.sk{display:flex;align-items:baseline;gap:16pt;padding:4pt 0;border-bottom:1pt solid #F1F5F9}
.sk-cat{font-family:'Space Mono','Courier New',monospace;font-size:5pt;letter-spacing:0.14em;color:#60A5FA;flex-shrink:0;width:140pt}
.sk-items{font-size:11pt;color:#0F172A;line-height:1.5;flex:1}

/* ── Project index ── */
.idx-row{display:flex;align-items:baseline;gap:9pt;padding:5pt 0;border-bottom:1pt solid #F1F5F9}
.idx-n{font-family:'Space Mono','Courier New',monospace;font-size:7pt;font-weight:700;color:#60A5FA;flex-shrink:0;width:16pt}
.idx-title{font-size:11pt;font-weight:600;color:#0F172A;flex:1;min-width:0}
.idx-tag{font-family:'Space Mono','Courier New',monospace;font-size:5pt;letter-spacing:0.14em;color:#60A5FA;border:0.75pt solid rgba(96,165,250,0.6);padding:1pt 4pt;flex-shrink:0}
.idx-org{font-family:'Space Mono','Courier New',monospace;font-size:5.5pt;color:#0F172A;flex-shrink:0;width:110pt;text-align:right}
.idx-per{font-family:'Space Mono','Courier New',monospace;font-size:5.5pt;color:#0F172A;flex-shrink:0;width:100pt;text-align:right}

/* ── Card header (no box border) ── */
.ch{display:flex;align-items:flex-start;gap:10pt;padding:0 0 9pt 0;border-bottom:1.5pt solid #60A5FA}
.cn{font-family:'Space Mono','Courier New',monospace;font-size:10pt;font-weight:700;color:#60A5FA;flex-shrink:0;padding-top:1pt}
.ct{flex:1;min-width:0}
.ctitle{font-size:13pt;font-weight:700;color:#0F172A;letter-spacing:0.01em;line-height:1.2;margin-bottom:3pt}
.corg{font-family:'Space Mono','Courier New',monospace;font-size:6pt;color:#0F172A;letter-spacing:0.05em}
.cr{display:flex;flex-direction:column;align-items:flex-end;gap:5pt;flex-shrink:0}
.ctag{font-family:'Space Mono','Courier New',monospace;font-size:5.5pt;letter-spacing:0.18em;color:#60A5FA;border:0.75pt solid rgba(96,165,250,0.7);padding:2pt 5pt}
.cper{font-family:'Space Mono','Courier New',monospace;font-size:6pt;color:#0F172A;letter-spacing:0.06em}

/* ── Sections: images left, text right ── */
.sec{padding-top:2pt;margin-bottom:3pt;display:flex;flex-direction:column}
.sec:first-of-type{padding-top:0}
.sec-label{font-family:'Space Mono','Courier New',monospace;font-size:8pt;letter-spacing:0.22em;color:#0F172A;padding-bottom:1pt;margin-bottom:2pt;border-bottom:1pt solid #CBD5E1;font-weight:600}
.sec-content{display:flex;flex-direction:row;gap:8pt;align-items:flex-start}

/* ── Images ── */
.si{display:flex;width:2.2in;flex-shrink:0;overflow:hidden}
.si-row{flex-direction:row;gap:2pt}
.si-col{flex-direction:column;gap:2pt;max-height:3.2in}
.img-slot{flex:1;overflow:hidden;min-width:0;min-height:0;height:auto;max-height:1.6in}
.img-slot img{width:100%;height:100%;object-fit:contain;display:block}

/* ── Bullets: font-size set per-card via inline style on <ul> ── */
.sec ul{display:flex;flex-direction:column;gap:3pt;flex:1}
.sec li{color:#0F172A;line-height:1.5;padding-left:11pt;position:relative;margin:0}
.sec li::before{content:'— ';position:absolute;left:0;color:#0F172A}
.sec li strong{color:#2563EB;font-weight:700}

/* ── Project-specific image sizing ── */
.launch-vehicle-design .si{width:1.63in}
.launch-vehicle-design .si-col{max-height:3.1in}
.launch-vehicle-design .img-slot{max-height:1.55in}
.autonomous-aerobot-thermal-control-subsystem .si{width:2.5in}
.geochemical-provenance-analysis .si{width:1.30in}
.geochemical-provenance-analysis .si-col{max-height:1.85in}
.geochemical-provenance-analysis .img-slot{max-height:0.65in}
`;
}

// ── Card height measurement ─────────────────────────────────────────────────────

const MAX_CARD_PX = Math.round(10.05 * 96); // 965 px  (10.05in content area)

function measureHTML(css, rawCardHTML, projectId = '') {
  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>${css}</style>
</head><body style="margin:0;padding:0;background:#fff">
<div class="card${projectId ? ' ' + projectId : ''}" style="margin:0">${rawCardHTML}</div>
</body></html>`;
}

async function findFittingFont(browser, entry, n, css, targetFont = 11) {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 816, height: 10000 });

  async function measure(bulletPt) {
    const html = measureHTML(css, cardHTML(entry, n, bulletPt), entry.id);
    await pg.setContent(html, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await pg.evaluate(() => document.fonts.ready);
    return pg.evaluate(() => {
      const c = document.querySelector('.card');
      return c ? Math.ceil(c.getBoundingClientRect().height) : 0;
    });
  }

  let font = targetFont;
  try {
    const hTarget = await measure(targetFont);
    console.log(`  [fit] ${entry.slug}: ${targetFont.toFixed(1)}pt → ${hTarget}px  (max ${MAX_CARD_PX}px)`);
    if (hTarget <= MAX_CARD_PX) return targetFont;

    // Proportional estimate with 8% safety buffer
    let est = Math.floor(targetFont * MAX_CARD_PX / hTarget * 0.92 * 10) / 10;
    est = Math.max(7, est);
    const hEst = await measure(est);
    console.log(`  [fit] ${entry.slug}: ${est.toFixed(1)}pt → ${hEst}px`);
    if (hEst <= MAX_CARD_PX) return est;

    // Fine-tune downward
    font = est;
    while (font >= 7) {
      font = Math.round((font - 0.1) * 10) / 10;
      const h = await measure(font);
      console.log(`  [fit] ${entry.slug}: ${font.toFixed(1)}pt → ${h}px`);
      if (h <= MAX_CARD_PX) return font;
    }
    return 7;
  } finally {
    await pg.close();
  }
}

// ── Full HTML ──────────────────────────────────────────────────────────────────

function buildHTML(profile, skills, entries, fontSizes, css) {
  const p = profile;
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>${css}</style>
</head><body>

<div class="cover">
  <div class="ident">
    <div class="iname">${p.name.toUpperCase()}</div>
    <div class="isub">${p.title} <span class="dot">·</span> ${p.location}</div>
    <div class="ilinks">${p.email} <span class="dot">·</span> ${p.linkedin.replace('https://','')} <span class="dot">·</span> ${p.github.replace('https://','')}</div>
  </div>
  <div class="p0-sec">
    <div class="sh">ABOUT</div>
    <p class="bio">${p.bio}</p>
    <table class="meta"><tbody>
      ${[['INSTITUTION',p.institution],['DEGREE',p.degree],['LOCATION',p.location]]
        .map(([l,v])=>`<tr><td class="ml">${l}</td><td class="mv">${v}</td></tr>`).join('')}
    </tbody></table>
  </div>
  <div class="p0-sec">
    <div class="sh">SKILLS</div>
    ${skills.map(g=>`<div class="sk">
      <span class="sk-cat">${g.category}</span>
      <span class="sk-items">${g.items.join(' · ')}</span>
    </div>`).join('')}
  </div>
  <div class="p0-sec">
    <div class="sh">PROJECTS</div>
    ${entries.map((e,i)=>`<div class="idx-row">
      <span class="idx-n">${String(i+1).padStart(2,'0')}</span>
      <span class="idx-title">${e.title}</span>
      <span class="idx-tag">${e.category}</span>
      <span class="idx-org">${e.org}</span>
      <span class="idx-per">${e.period}</span>
    </div>`).join('')}
  </div>
</div>

${entries.map((e,i)=>`<div class="card${i===0?' first-card':''} ${e.id}">
  ${cardHTML(e, i+1, fontSizes[i])}
</div>`).join('\n')}

</body></html>`;
}

// ── Run ────────────────────────────────────────────────────────────────────────

(async () => {
  cleanPDFs();

  const { profile, skills, entries } = loadData();
  console.log(`[pdf] ${entries.length} projects loaded`);

  const IMG_H = '1.8in'; // reduced for linear layout
  const css   = buildCSS(IMG_H);

  const browser = await puppeteer.launch({ headless:true, args:['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    // ── Per-card font fitting ──
    console.log('[pdf] fitting fonts...');
    const fontSizes = [];
    for (const [i, e] of entries.entries()) {
      const targetFont = e.id === 'geochemical-provenance-analysis' ? 9.7 : 11;
      const f = await findFittingFont(browser, e, i+1, css, targetFont);
      fontSizes.push(f);
      console.log(`[pdf] ${e.slug} → ${f.toFixed(1)}pt`);
    }

    // ── Build & render final page ──
    const html = buildHTML(profile, skills, entries, fontSizes, css);

    // Estimate total pages (rough): cover + natural card flow
    const totalPages = 1 + entries.length; // upper bound
    const PX_PER_PAGE = Math.round(10.05 * 96);

    const pg = await browser.newPage();
    await pg.setViewport({ width: 816, height: PX_PER_PAGE * totalPages + 500 });
    await pg.setContent(html, { waitUntil: 'domcontentloaded', baseURL: `file://${ROOT}/`, timeout: 120000 });
    await pg.evaluate(() => document.fonts.ready);

    // ── Screenshots ──
    const shotsDir = path.join(RESUME, 'preview');
    fs.mkdirSync(shotsDir, { recursive: true });
    // Clear old previews
    for (const f of fs.readdirSync(shotsDir)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(shotsDir, f));
    }

    for (let i = 0; i < totalPages; i++) {
      const file = path.join(shotsDir, `page${String(i+1).padStart(2,'0')}.png`);
      await pg.screenshot({ path: file, clip: { x:0, y: i * PX_PER_PAGE, width:816, height:PX_PER_PAGE } });
      console.log(`[pdf] shot → ${path.relative(ROOT, file)}`);
    }

    // ── PDF ──
    const outPDF = path.join(RESUME, 'Shafayat_Alam_Portfolio.pdf');
    await pg.pdf({
      path: outPDF,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.55in', bottom: '0.45in', left: '0.55in' },
      displayHeaderFooter: true,
      headerTemplate: '<div style="height:0;font-size:0;line-height:0"> </div>',
      footerTemplate: `<div id="pf" style="
        width:100%;text-align:right;padding:0 0.55in;
        font-family:'Courier New',monospace;font-size:7pt;color:#0F172A;
        -webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span>
      </div>
      <script>
        try{
          var f=document.getElementById('pf');
          var pn=f&&f.querySelector('.pageNumber');
          if(pn&&pn.textContent.trim()==='1') f.style.visibility='hidden';
        }catch(e){}
      </script>`,
    });
    console.log(`\n[pdf] saved → ${path.relative(ROOT, outPDF)}`);
    console.log('[pdf] font sizes used:');
    entries.forEach((e, i) => console.log(`  ${String(i+1).padStart(2,'0')} ${e.slug}: ${fontSizes[i].toFixed(1)}pt`));

    await pg.close();
  } finally {
    await browser.close();
  }
})().catch(err => { console.error('[pdf]', err.message); process.exit(1); });
