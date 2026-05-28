'use strict';

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const ROOT    = path.resolve(__dirname, '..');
const DATA    = path.join(ROOT, 'Data');
const OUT_PDF = path.join(ROOT, 'Resume', 'Shafayat_Alam_Portfolio.pdf');

// ── Data ───────────────────────────────────────────────────────────────────────

function loadData() {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'projects.json'), 'utf8'));
  const entries = manifest.projects.map(slug => {
    try {
      return { ...JSON.parse(fs.readFileSync(path.join(DATA, slug, 'project.json'), 'utf8')), slug };
    } catch { return null; }
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

// ── Puppeteer header / footer ──────────────────────────────────────────────────

function headerTpl(p) {
  return `<div style="
    width:100%; padding:0 0.55in; box-sizing:border-box;
    background:#0A0A0A; -webkit-print-color-adjust:exact; print-color-adjust:exact;
    border-bottom:1pt solid rgba(96,165,250,0.25); padding-bottom:6pt;">
    <div style="
      font-family:'Courier New',monospace; font-size:8pt; font-weight:700;
      letter-spacing:0.1em; color:#FFFFFF;">
      ${p.name.toUpperCase()}
    </div>
    <div style="font-size:6.5pt; color:#8A8680; margin-top:2pt; letter-spacing:0.04em; font-family:'Courier New',monospace;">
      ${p.title}&nbsp;&nbsp;·&nbsp;&nbsp;${p.location}&nbsp;&nbsp;·&nbsp;&nbsp;${p.email}&nbsp;&nbsp;·&nbsp;&nbsp;${p.linkedin.replace('https://','')}&nbsp;&nbsp;·&nbsp;&nbsp;${p.github.replace('https://','')}
    </div>
  </div>`;
}

function footerTpl() {
  return `<div style="
    width:100%; text-align:right; padding:0 0.55in;
    font-family:'Courier New',monospace; font-size:6pt; color:#8A8680;
    background:#0A0A0A; -webkit-print-color-adjust:exact; print-color-adjust:exact;">
    <span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span>
  </div>`;
}

// ── Card HTML ──────────────────────────────────────────────────────────────────

function sectionImgs(slug, images, dir) {
  if (!images || !images.length) return '';
  const slots = images.map(p => {
    const uri = imgURI(slug, p);
    return uri ? `<div class="img-slot"><img src="${uri}"></div>` : '';
  }).filter(Boolean).join('');
  if (!slots) return '';
  return `<div class="section-imgs" style="flex-direction:${dir === 'row' ? 'row' : 'column'}">${slots}</div>`;
}

function cardHTML(e, n) {
  const cols = [
    { label: 'WHAT?',   bullets: e.what,    images: e.what_images    || [], dir: e.what_images_direction    || 'column' },
    { label: 'HOW?',    bullets: e.how,     images: e.how_images     || [], dir: e.how_images_direction     || 'column' },
    { label: 'RESULTS', bullets: e.results, images: e.results_images || [], dir: e.results_images_direction || 'column' },
  ];

  return `
  <div class="card-hd">
    <span class="cn">${String(n).padStart(2, '0')}</span>
    <div class="ct">
      <div class="ctitle">${e.title}</div>
      <div class="corg">${e.org}&nbsp;&nbsp;·&nbsp;&nbsp;${e.institution}</div>
    </div>
    <div class="cr">
      <span class="ctag">${e.category}</span>
      <span class="cper">${e.period}</span>
    </div>
  </div>
  <div class="card-body">
    ${cols.map(c => `
      <div class="dcol">
        <div class="dlabel">${c.label}</div>
        ${sectionImgs(e.slug, c.images, c.dir)}
        <ul>${c.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>`).join('')}
  </div>`;
}

// ── Full HTML ──────────────────────────────────────────────────────────────────

function buildHTML(profile, skills, entries) {
  const p = profile;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>

<!-- ── About & Skills ── -->
<div class="apage">

  <div class="identity">
    <div class="id-name">${p.name.toUpperCase()}</div>
    <div class="id-title">${p.title}</div>
    <div class="id-links">
      <span>${p.email}</span>
      <span class="dot">·</span>
      <span>${p.linkedin.replace('https://','')}</span>
      <span class="dot">·</span>
      <span>${p.github.replace('https://','')}</span>
    </div>
  </div>

  <div class="about-grid">
    <div class="about-left">
      <div class="sec-hdr">ABOUT</div>
      <p class="bio">${p.bio}</p>
      <div class="meta">
        ${[['INSTITUTION', p.institution], ['DEGREE', p.degree], ['LOCATION', p.location]]
          .map(([l, v]) => `<div class="mrow"><span class="ml">${l}</span><span class="mv">${v}</span></div>`)
          .join('')}
      </div>
    </div>

    <div class="about-right">
      <div class="sec-hdr">SKILLS</div>
      ${skills.map(g => `
        <div class="sk-row">
          <span class="sk-cat">${g.category}</span>
          <span class="sk-items">${g.items.join(' · ')}</span>
        </div>`).join('')}
    </div>
  </div>

  <div class="work-index">
    <div class="sec-hdr">WORK</div>
    <div class="idx-grid">
      ${entries.map((e, i) => `
        <div class="idx-row">
          <span class="idx-n">${String(i + 1).padStart(2, '0')}</span>
          <span class="idx-title">${e.title}</span>
          <span class="idx-tag">${e.category}</span>
          <span class="idx-org">${e.org}</span>
          <span class="idx-per">${e.period}</span>
        </div>`).join('')}
    </div>
  </div>

</div>

<!-- ── Project pages ── -->
${entries.map((e, i) => `
  <div class="cpage break">
    ${cardHTML(e, i + 1)}
  </div>`).join('')}

</body>
</html>`;
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
* { box-sizing:border-box; margin:0; padding:0; }
body {
  font-family:'Space Grotesk', -apple-system, 'Helvetica Neue', Arial, sans-serif;
  font-size:8.5pt;
  color:#FFFFFF;
  background:#0A0A0A;
  line-height:1.55;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
ul { list-style:none; }

/* ── Page containers ── */
.apage {
  height:calc(11in - 1.05in - 0.5in);
  display:flex;
  flex-direction:column;
  gap:22pt;
  overflow:hidden;
}
.cpage {
  height:calc(11in - 1.05in - 0.5in);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.break { page-break-before:always; break-before:page; }

/* ── Identity block (about page) ── */
.identity {
  padding-bottom:14pt;
  border-bottom:1pt solid rgba(96,165,250,0.2);
}
.id-name {
  font-family:'Space Mono','Courier New',monospace;
  font-size:16pt;
  font-weight:700;
  letter-spacing:0.08em;
  color:#FFFFFF;
  margin-bottom:4pt;
}
.id-title {
  font-size:10pt;
  color:#E0DDD8;
  font-weight:500;
  margin-bottom:5pt;
}
.id-links {
  font-family:'Space Mono','Courier New',monospace;
  font-size:6.5pt;
  color:#60A5FA;
  letter-spacing:0.05em;
  display:flex;
  gap:7pt;
  align-items:center;
}
.id-links .dot { color:#8A8680; }

/* ── About + Skills two-column ── */
.about-grid {
  display:flex;
  gap:20pt;
  flex-shrink:0;
}
.about-left { flex:1.4; }
.about-right { flex:1; }

/* ── Section header label ── */
.sec-hdr {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5.5pt;
  letter-spacing:0.24em;
  color:#60A5FA;
  border-bottom:1pt solid rgba(255,255,255,0.08);
  padding-bottom:4pt;
  margin-bottom:10pt;
}

/* ── Bio ── */
.bio {
  font-size:8.5pt;
  line-height:1.7;
  color:#E0DDD8;
  margin-bottom:12pt;
}

/* ── Meta table ── */
.meta { display:table; }
.mrow { display:table-row; }
.ml,.mv { display:table-cell; padding:2pt 0; vertical-align:baseline; }
.ml {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5pt;
  letter-spacing:0.16em;
  color:#60A5FA;
  padding-right:14pt;
  white-space:nowrap;
}
.mv { font-size:7.5pt; color:#E0DDD8; }

/* ── Skills ── */
.sk-row {
  display:flex;
  gap:10pt;
  padding:3pt 0;
  border-bottom:1pt solid rgba(255,255,255,0.05);
  align-items:baseline;
}
.sk-cat {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5pt;
  letter-spacing:0.13em;
  color:#60A5FA;
  width:130pt;
  flex-shrink:0;
}
.sk-items { font-size:7.5pt; color:#E0DDD8; line-height:1.4; }

/* ── Work index ── */
.work-index { flex:1; min-height:0; }
.idx-grid {
  display:flex;
  flex-direction:column;
  gap:0;
}
.idx-row {
  display:flex;
  align-items:baseline;
  gap:10pt;
  padding:4.5pt 0;
  border-bottom:1pt solid rgba(255,255,255,0.05);
}
.idx-n {
  font-family:'Space Mono','Courier New',monospace;
  font-size:7pt;
  font-weight:700;
  color:#60A5FA;
  flex-shrink:0;
  width:18pt;
}
.idx-title {
  font-size:8pt;
  font-weight:600;
  color:#FFFFFF;
  flex:1;
  min-width:0;
}
.idx-tag {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5pt;
  letter-spacing:0.14em;
  color:#60A5FA;
  border:0.75pt solid rgba(96,165,250,0.5);
  padding:1pt 4pt;
  flex-shrink:0;
}
.idx-org {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5.5pt;
  color:#8A8680;
  flex-shrink:0;
  width:120pt;
  text-align:right;
}
.idx-per {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5.5pt;
  color:#8A8680;
  flex-shrink:0;
  width:100pt;
  text-align:right;
}

/* ── Card header ── */
.card-hd {
  display:flex;
  align-items:flex-start;
  gap:10pt;
  padding-bottom:8pt;
  border-bottom:1pt solid rgba(255,255,255,0.09);
  margin-bottom:8pt;
  flex-shrink:0;
}
.cn {
  font-family:'Space Mono','Courier New',monospace;
  font-size:9pt;
  font-weight:700;
  color:#60A5FA;
  flex-shrink:0;
  margin-top:1pt;
}
.ct { flex:1; min-width:0; }
.ctitle {
  font-size:11pt;
  font-weight:700;
  color:#FFFFFF;
  margin-bottom:3pt;
  letter-spacing:0.02em;
  line-height:1.2;
}
.corg {
  font-family:'Space Mono','Courier New',monospace;
  font-size:6pt;
  color:#8A8680;
  letter-spacing:0.05em;
}
.cr { display:flex; flex-direction:column; align-items:flex-end; gap:5pt; flex-shrink:0; }
.ctag {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5.5pt;
  letter-spacing:0.18em;
  color:#60A5FA;
  border:0.75pt solid rgba(96,165,250,0.6);
  padding:1.5pt 5pt;
}
.cper {
  font-family:'Space Mono','Courier New',monospace;
  font-size:6pt;
  color:#8A8680;
  letter-spacing:0.06em;
}

/* ── Card body: 3 columns ── */
.card-body {
  flex:1;
  display:flex;
  gap:2pt;
  min-height:0;
}
.dcol {
  flex:1;
  display:flex;
  flex-direction:column;
  border:1pt solid rgba(255,255,255,0.09);
  min-width:0;
  overflow:hidden;
}
.dlabel {
  font-family:'Space Mono','Courier New',monospace;
  font-size:5.5pt;
  letter-spacing:0.22em;
  color:#8A8680;
  padding:5pt 8pt 4pt;
  border-bottom:1pt solid rgba(255,255,255,0.06);
  flex-shrink:0;
}

/* ── Section images ── */
.section-imgs {
  display:flex;
  height:2.2in;
  border-bottom:1pt solid rgba(255,255,255,0.06);
  overflow:hidden;
  flex-shrink:0;
}
.img-slot {
  flex:1;
  overflow:hidden;
  min-width:0;
  min-height:0;
}
.img-slot img {
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
}

/* ── Bullets ── */
.dcol ul {
  flex:1;
  padding:7pt 8pt;
  display:flex;
  flex-direction:column;
  gap:4pt;
  overflow:hidden;
}
.dcol li {
  font-size:7pt;
  color:#E0DDD8;
  line-height:1.45;
  padding-left:10pt;
  position:relative;
}
.dcol li::before {
  content:'—';
  position:absolute;
  left:0;
  color:rgba(255,255,255,0.18);
  font-size:7pt;
}
.dcol li strong { color:#60A5FA; font-weight:600; }
`;

// ── Run ────────────────────────────────────────────────────────────────────────

(async () => {
  console.log('[pdf] Loading data...');
  const { profile, skills, entries } = loadData();
  console.log(`[pdf] ${entries.length} projects loaded`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 816, height: 1056 });
    await page.setContent(buildHTML(profile, skills, entries), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);

    console.log('[pdf] Rendering...');
    await page.pdf({
      path: OUT_PDF,
      format: 'Letter',
      printBackground: true,
      margin: { top: '1.05in', right: '0.55in', bottom: '0.5in', left: '0.55in' },
      displayHeaderFooter: true,
      headerTemplate: headerTpl(profile),
      footerTemplate: footerTpl(),
    });
    console.log(`[pdf] Saved → ${OUT_PDF}`);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('[pdf] Error:', err.message);
  process.exit(1);
});
