'use strict';

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const ROOT    = path.resolve(__dirname, '..');
const DATA    = path.join(ROOT, 'Data');
const OUT_PDF = path.join(ROOT, 'Resume', 'Shafayat_Alam_Portfolio.pdf');

// ── Data loading ───────────────────────────────────────────────────────────────

function loadData() {
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'projects.json'), 'utf8'));
  const entries = manifest.projects.map(slug => {
    try {
      return { ...JSON.parse(fs.readFileSync(path.join(DATA, slug, 'project.json'), 'utf8')), slug };
    } catch { return null; }
  }).filter(Boolean);
  return { profile: manifest.profile, skills: manifest.skills, entries };
}

// ── Puppeteer header / footer (repeated on every page) ────────────────────────

function headerTpl(p) {
  return `<div style="
    width:100%; padding:0 0.55in; box-sizing:border-box;
    font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;
    border-bottom:1.5pt solid #1D4ED8; padding-bottom:6pt;">
    <div style="font-family:'Courier New',monospace; font-size:9pt; font-weight:700;
                letter-spacing:0.12em; color:#0F172A;">
      ${p.name.toUpperCase()}
    </div>
    <div style="font-size:7pt; color:#64748B; margin-top:2pt; letter-spacing:0.03em;">
      ${p.title}&nbsp;&nbsp;·&nbsp;&nbsp;${p.location}&nbsp;&nbsp;·&nbsp;&nbsp;${p.email}&nbsp;&nbsp;·&nbsp;&nbsp;${p.linkedin.replace('https://','')}&nbsp;&nbsp;·&nbsp;&nbsp;${p.github.replace('https://','')}
    </div>
  </div>`;
}

function footerTpl() {
  return `<div style="
    width:100%; text-align:right; padding:0 0.55in;
    font-size:7pt; font-family:'Courier New',monospace; color:#94A3B8;">
    <span class="pageNumber"></span>&thinsp;/&thinsp;<span class="totalPages"></span>
  </div>`;
}

// ── HTML body ──────────────────────────────────────────────────────────────────

function buildHTML(profile, skills, entries) {
  const p = profile;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>

<section class="intro">
  <div class="sec-label">ABOUT</div>
  <p class="bio">${p.bio}</p>
  <div class="meta">
    ${[['INSTITUTION', p.institution], ['DEGREE', p.degree], ['LOCATION', p.location]]
      .map(([l, v]) => `<div class="mrow"><span class="ml">${l}</span><span class="mv">${v}</span></div>`)
      .join('')}
  </div>
</section>

<section class="skills">
  <div class="sec-label">SKILLS</div>
  ${skills.map(g => `
    <div class="sk-row">
      <span class="sk-cat">${g.category}</span>
      <span class="sk-items">${g.items.join(' · ')}</span>
    </div>`).join('')}
</section>

${buildCardsHTML(entries)}
</body>
</html>`;
}

// ── Cards ──────────────────────────────────────────────────────────────────────

function buildCardsHTML(entries) {
  if (!entries.length) return '';
  let html = '';

  // First card gets its own page
  html += `<div class="cpage break">${cardHTML(entries[0], 1)}</div>`;

  // Remaining entries — 2 per page
  for (let i = 1; i < entries.length; i += 2) {
    html += `<div class="cpage break">
      ${cardHTML(entries[i], i + 1)}
      ${entries[i + 1] ? cardHTML(entries[i + 1], i + 2) : ''}
    </div>`;
  }
  return html;
}

function cardHTML(e, n) {
  const li = arr => arr.map(b => `<li>${b}</li>`).join('');
  return `
  <article class="card">
    <div class="card-hd">
      <span class="cn">${String(n).padStart(2, '0')}</span>
      <div class="ct">
        <div class="ctitle">${e.title}</div>
        <div class="corg">${e.org} · ${e.institution}</div>
      </div>
      <div class="cr">
        <span class="ctag">${e.category}</span>
        <span class="cper">${e.period}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="dcol">
        <div class="dlabel">WHAT</div><ul>${li(e.what)}</ul>
      </div>
      <div class="dcol">
        <div class="dlabel">HOW</div><ul>${li(e.how)}</ul>
      </div>
      <div class="dcol res">
        <div class="dlabel">RESULTS</div><ul>${li(e.results)}</ul>
      </div>
    </div>
  </article>`;
}

// ── CSS ────────────────────────────────────────────────────────────────────────

const CSS = `
*  { box-sizing:border-box; margin:0; padding:0 }
body { font-family:-apple-system,'Helvetica Neue',Arial,sans-serif; font-size:9pt; color:#0F172A; line-height:1.55; background:#fff }
ul   { list-style:none }

/* ── About ── */
.intro { margin-bottom:1.6em }
.sec-label {
  font-family:'Courier New',monospace; font-size:6pt; letter-spacing:0.24em;
  color:#64748B; text-transform:uppercase;
  border-bottom:1pt solid #E2E8F0; padding-bottom:4pt; margin-bottom:9pt;
}
.bio { font-size:9.5pt; line-height:1.75; color:#1E293B; margin-bottom:10pt; max-width:76% }

.meta { display:table }
.mrow { display:table-row }
.ml, .mv { display:table-cell; padding:1.5pt 0; vertical-align:baseline }
.ml {
  font-family:'Courier New',monospace; font-size:5.5pt; letter-spacing:0.16em;
  color:#1D4ED8; text-transform:uppercase; padding-right:16pt; white-space:nowrap;
}
.mv { font-size:8pt; color:#334155 }

/* ── Skills ── */
.skills { margin-bottom:0.6em }
.sk-row {
  display:flex; gap:14pt; padding:3pt 0;
  border-bottom:1pt solid #F8FAFC; align-items:baseline;
}
.sk-cat {
  font-family:'Courier New',monospace; font-size:5.5pt; letter-spacing:0.14em;
  color:#1D4ED8; text-transform:uppercase; width:165pt; flex-shrink:0;
}
.sk-items { font-size:8pt; color:#334155 }

/* ── Card pages ── */
.cpage  { display:flex; flex-direction:column; gap:10pt }
.break  { page-break-before:always; break-before:page }

/* ── Card ── */
.card { border:1pt solid #E2E8F0; padding:13pt 15pt; page-break-inside:avoid; break-inside:avoid }

.card-hd {
  display:flex; align-items:flex-start; gap:10pt;
  padding-bottom:8pt; border-bottom:1pt solid #F1F5F9; margin-bottom:9pt;
}
.cn {
  font-family:'Courier New',monospace; font-size:8pt; font-weight:700;
  color:#1D4ED8; flex-shrink:0; margin-top:1pt;
}
.ct { flex:1; min-width:0 }
.ctitle {
  font-size:10.5pt; font-weight:700; color:#0F172A;
  margin-bottom:2pt; letter-spacing:0.01em; line-height:1.25;
}
.corg { font-family:'Courier New',monospace; font-size:6.5pt; color:#64748B; letter-spacing:0.04em }
.cr   { display:flex; flex-direction:column; align-items:flex-end; gap:4pt; flex-shrink:0 }
.ctag {
  font-family:'Courier New',monospace; font-size:5.5pt; letter-spacing:0.18em;
  color:#1D4ED8; border:0.75pt solid #1D4ED8; padding:1.5pt 5.5pt;
}
.cper { font-family:'Courier New',monospace; font-size:6pt; color:#94A3B8; letter-spacing:0.06em }

.card-body { display:flex; gap:6pt }
.dcol { flex:1; border:1pt solid #F1F5F9; padding:7pt 9pt }
.dlabel {
  font-family:'Courier New',monospace; font-size:5.5pt; letter-spacing:0.18em;
  color:#94A3B8; text-transform:uppercase;
  margin-bottom:5pt; padding-bottom:3pt; border-bottom:1pt solid #F1F5F9;
}
.dcol ul { display:flex; flex-direction:column; gap:4pt }
.dcol li {
  font-size:7.5pt; color:#334155; line-height:1.4;
  padding-left:10pt; position:relative;
}
.dcol li::before { content:'—'; position:absolute; left:0; color:#94A3B8; font-size:7pt }
.res li { color:#0F172A; font-weight:500 }
.res li strong { color:#1D4ED8 }
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
    await page.setContent(buildHTML(profile, skills, entries), { waitUntil: 'domcontentloaded' });

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
