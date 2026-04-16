let allArtworks = [];
let filters = { style: null, medium: null, price: null, sort: 'recent' };

const PRICE_RANGES = [
  { key: '0-500', label: '< 500 CHF', min: 0, max: 500 },
  { key: '500-1000', label: '500 – 1 000 CHF', min: 500, max: 1000 },
  { key: '1000-2000', label: '1 000 – 2 000 CHF', min: 1000, max: 2000 },
  { key: '2000+', label: '2 000+ CHF', min: 2000, max: Infinity },
];

const STYLES = ['paysage', 'abstrait', 'portrait', 'nature'];
const MEDIUMS = ['Peinture', 'Photographie', 'Dessin', 'Technique mixte'];

async function init() {
  allArtworks = await loadArtworks();
  buildFilterPanels();
  render(false);

  // Delegate heart clicks on gallery
  document.getElementById('gallery').addEventListener('click', e => {
    const heart = e.target.closest('.heart-btn');
    if (heart) {
      e.preventDefault();
      e.stopPropagation();
      const liked = toggleLike(heart.dataset.id);
      heart.classList.toggle('liked', liked);
      showToast(liked ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }
  });

  // Filter toggle buttons
  document.querySelector('.filter-toggles').addEventListener('click', e => {
    const toggle = e.target.closest('.filter-toggle');
    if (!toggle) return;
    const panel = toggle.dataset.panel;
    document.querySelectorAll('.filter-panel').forEach(p => {
      p.classList.toggle('open', p.dataset.panel === panel && !p.classList.contains('open'));
    });
  });

  // Sort select
  document.getElementById('sort-select')?.addEventListener('change', e => {
    filters.sort = e.target.value;
    render();
  });

  // Active tags (remove filter)
  document.getElementById('active-filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-clear]');
    if (!btn) return;
    const key = btn.dataset.clear;
    filters[key] = null;
    syncChips();
    render();
  });
}

function buildFilterPanels() {
  // Style panel
  const stylePanel = document.querySelector('[data-panel="style"]');
  if (stylePanel) {
    stylePanel.innerHTML = STYLES.map(s =>
      `<button class="filter-chip" data-key="style" data-value="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`
    ).join('');
  }

  // Medium panel
  const mediumPanel = document.querySelector('[data-panel="medium"]');
  if (mediumPanel) {
    mediumPanel.innerHTML = MEDIUMS.map(m =>
      `<button class="filter-chip" data-key="medium" data-value="${m}">${escapeHtml(m)}</button>`
    ).join('');
  }

  // Price panel
  const pricePanel = document.querySelector('[data-panel="price"]');
  if (pricePanel) {
    pricePanel.innerHTML = PRICE_RANGES.map(r =>
      `<button class="filter-chip" data-key="price" data-value="${r.key}">${r.label}</button>`
    ).join('');
  }

  // Chip clicks (delegate on filter-bar)
  document.querySelector('.filter-bar').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const { key, value } = chip.dataset;
    filters[key] = filters[key] === value ? null : value;
    syncChips();
    render();
  });
}

function syncChips() {
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', filters[c.dataset.key] === c.dataset.value);
  });

  // Toggle button counts
  ['style', 'medium', 'price'].forEach(key => {
    const btn = document.querySelector(`.filter-toggle[data-panel="${key}"]`);
    const countEl = btn?.querySelector('.count');
    if (countEl) {
      countEl.textContent = filters[key] ? '1' : '';
      countEl.style.display = filters[key] ? '' : 'none';
    }
  });

  // Active tags
  const container = document.getElementById('active-filters');
  const parts = [];
  if (filters.style) parts.push(`<span class="active-tag">${filters.style[0].toUpperCase() + filters.style.slice(1)} <button data-clear="style">&times;</button></span>`);
  if (filters.medium) parts.push(`<span class="active-tag">${escapeHtml(filters.medium)} <button data-clear="medium">&times;</button></span>`);
  if (filters.price) {
    const r = PRICE_RANGES.find(r => r.key === filters.price);
    if (r) parts.push(`<span class="active-tag">${r.label} <button data-clear="price">&times;</button></span>`);
  }
  container.innerHTML = parts.length
    ? `<span style="color:var(--muted);font-size:0.82rem;">Filtres :</span> ${parts.join('')}`
    : '';
}

function render(animate = true) {
  const gallery = document.getElementById('gallery');
  let list = allArtworks.slice();

  if (filters.style) list = list.filter(a => a.category === filters.style);
  if (filters.medium) list = list.filter(a => a.medium === filters.medium);
  if (filters.price) {
    const r = PRICE_RANGES.find(r => r.key === filters.price);
    if (r) list = list.filter(a => a.price >= r.min && a.price < r.max);
  }

  switch (filters.sort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'bestseller': list.sort((a, b) => (b.sales || 0) - (a.sales || 0)); break;
    case 'recent':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
  }

  const html = list.length
    ? list.map((a, i) => cardHTML(a, i)).join('')
    : `<p class="gallery-empty">Aucune œuvre ne correspond à ces filtres.</p>`;

  if (animate) {
    gallery.classList.add('fading');
    setTimeout(() => { gallery.innerHTML = html; gallery.classList.remove('fading'); }, 180);
  } else {
    gallery.innerHTML = html;
  }

  syncChips();
}

init();
