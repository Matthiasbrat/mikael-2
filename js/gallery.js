let allArtworks = [];
let filters = { cat: 'all', price: '', medium: '', sort: 'recent' };

const PRICE_RANGES = {
  '0-500':     { min: 0, max: 500 },
  '500-1000':  { min: 500, max: 1000 },
  '1000-2000': { min: 1000, max: 2000 },
  '2000+':     { min: 2000, max: Infinity },
};

async function init() {
  allArtworks = await loadArtworks();
  render(false);

  // Category tabs
  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.cat = btn.dataset.cat;
      render();
    });
  });

  // Native select filters
  document.getElementById('price-filter').addEventListener('change', e => {
    filters.price = e.target.value;
    render();
  });
  document.getElementById('medium-filter').addEventListener('change', e => {
    filters.medium = e.target.value;
    render();
  });
  document.getElementById('sort-select').addEventListener('change', e => {
    filters.sort = e.target.value;
    render();
  });

  // Heart clicks on gallery (delegated)
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

  // Active-tags: click × to clear a filter
  document.getElementById('active-filters').addEventListener('click', e => {
    const btn = e.target.closest('[data-clear]');
    if (!btn) return;
    const key = btn.dataset.clear;
    if (key === 'price') { filters.price = ''; document.getElementById('price-filter').value = ''; }
    if (key === 'medium') { filters.medium = ''; document.getElementById('medium-filter').value = ''; }
    render();
  });
}

function render(animate = true) {
  const gallery = document.getElementById('gallery');
  let list = allArtworks.slice();

  if (filters.cat !== 'all') list = list.filter(a => a.category === filters.cat);
  if (filters.medium) list = list.filter(a => a.medium === filters.medium);
  if (filters.price && PRICE_RANGES[filters.price]) {
    const r = PRICE_RANGES[filters.price];
    list = list.filter(a => a.price >= r.min && a.price < r.max);
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

  renderActiveTags();
}

function renderActiveTags() {
  const parts = [];
  if (filters.price) {
    const labels = { '0-500': '< 500 CHF', '500-1000': '500–1 000 CHF', '1000-2000': '1 000–2 000 CHF', '2000+': '2 000+ CHF' };
    parts.push(`<span class="active-tag">${labels[filters.price] || filters.price} <button data-clear="price">&times;</button></span>`);
  }
  if (filters.medium) {
    parts.push(`<span class="active-tag">${escapeHtml(filters.medium)} <button data-clear="medium">&times;</button></span>`);
  }
  document.getElementById('active-filters').innerHTML = parts.length
    ? `<span class="active-label">Filtres :</span> ${parts.join('')}`
    : '';
}

init();
