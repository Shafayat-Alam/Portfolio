async function init() {
  try {
    const res = await fetch('data/content.json');
    if (!res.ok) throw new Error('Could not load content.json');
    const data = await res.json();

    applyProfile(data.profile);
    renderWork(data.entries);
    renderSkills(data.skills);
    renderAbout(data.profile);
    renderContact(data.profile);

    document.getElementById('footer-name').textContent =
      `© ${new Date().getFullYear()} ${data.profile.name}`;

    setupNav();
    setupScrollReveal();
  } catch (err) {
    console.error('Portfolio init error:', err);
  }
}

/* ── Profile ── */
function applyProfile(p) {
  document.title = `${p.name} — ${p.title}`;
  const [first, ...rest] = p.name.split(' ');
  document.getElementById('hero-first').textContent = first.toUpperCase();
  document.getElementById('hero-last').textContent  = rest.join(' ').toUpperCase();
  document.getElementById('hero-title').textContent = p.title;
  document.getElementById('hero-edu').textContent   = p.education;
  document.getElementById('hero-location').textContent = p.location;
}

/* ── Work ── */
function renderWork(entries) {
  const grid = document.getElementById('work-grid');
  entries.forEach((entry, i) => {
    const card = buildCard(entry, String(i + 1).padStart(2, '0'));
    card.classList.add('reveal');
    grid.appendChild(card);
  });
}

function buildCard(e, num) {
  const article = document.createElement('article');
  article.className = 'card';

  article.innerHTML = `
    <div class="card-header">
      <span class="card-num">${num}</span>
      <div>
        <h3 class="card-title">${e.title}</h3>
        <span class="card-org">${e.org} · ${e.institution}</span>
      </div>
      <span class="card-tag">${e.category}</span>
    </div>

    <div class="card-images">
      ${[0, 1, 2].map(i => imageSlot(e, i)).join('')}
    </div>

    <div class="card-details">
      <div class="detail-col what">
        <h4>What?</h4>
        <ul>${e.what.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
      <div class="detail-col how">
        <h4>How?</h4>
        <ul>${e.how.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
      <div class="detail-col results">
        <h4>Results</h4>
        <ul>${e.results.map(b => `<li>${b}</li>`).join('')}</ul>
      </div>
    </div>

    <div class="card-footer">
      <span class="card-period">${e.period}</span>
      ${e.report ? `<a href="${e.report}" target="_blank" class="card-report">VIEW REPORT ↗</a>` : ''}
    </div>
  `;

  /* Attach image error handlers after the HTML is set */
  article.querySelectorAll('.img-slot img').forEach(img => {
    img.addEventListener('error', function () {
      const slot = this.closest('.img-slot');
      const idx  = this.dataset.idx;
      slot.innerHTML = placeholder(`IMAGE ${Number(idx) + 1}`);
    });
  });

  return article;
}

function imageSlot(entry, i) {
  const path = entry.images && entry.images[i];
  if (path) {
    return `<div class="img-slot">
      <img src="${path}" alt="${entry.title} — image ${i + 1}" loading="lazy" data-idx="${i}">
    </div>`;
  }
  return `<div class="img-slot">${placeholder(`IMAGE ${i + 1}`)}</div>`;
}

function placeholder(label) {
  return `<div class="img-placeholder">
    <span class="img-placeholder-plus">+</span>
    <span class="img-placeholder-label">${label}</span>
  </div>`;
}

/* ── Skills ── */
function renderSkills(skills) {
  const grid = document.getElementById('skills-grid');
  skills.forEach(group => {
    const el = document.createElement('div');
    el.className = 'skill-group reveal';
    el.innerHTML = `
      <div class="skill-group-label">${group.category}</div>
      <div class="skill-tags">
        ${group.items.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>`;
    grid.appendChild(el);
  });
}

/* ── About ── */
function renderAbout(p) {
  document.getElementById('about-content').innerHTML = `
    <div class="about-text reveal">
      <p>${p.bio}</p>
    </div>
    <div class="about-meta reveal">
      ${[
        ['Institution', p.institution],
        ['Degree',      p.degree],
        ['Location',    p.location],
        ['GitHub',      p.github.replace('https://', '')],
      ].map(([label, value]) => `
        <div class="about-meta-row">
          <span class="about-meta-label">${label}</span>
          <span class="about-meta-value">${value}</span>
        </div>`).join('')}
    </div>`;
}

/* ── Contact ── */
function renderContact(p) {
  const links = [
    { label: 'Email',    value: p.email,    href: `mailto:${p.email}` },
    { label: 'LinkedIn', value: p.linkedin.replace('https://', ''), href: p.linkedin },
    { label: 'GitHub',   value: p.github.replace('https://', ''),   href: p.github },
  ];
  document.getElementById('contact-content').innerHTML = links.map(l => `
    <a href="${l.href}" class="contact-link" ${l.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
      <span class="contact-link-label">${l.label}</span>
      <span class="contact-link-value">${l.value}</span>
      <span class="contact-arrow">↗</span>
    </a>`).join('');
}

/* ── Nav scroll state ── */
function setupNav() {
  const nav     = document.getElementById('nav');
  const navAs   = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    navAs.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

/* ── Scroll reveal ── */
function setupScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      /* stagger cards by their order in the grid */
      const delay = entry.target.closest('.work-grid')
        ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 40
        : 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.04, rootMargin: '0px 0px -30px 0px' });

  /* Observe after DOM is populated */
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });
}

document.addEventListener('DOMContentLoaded', init);
