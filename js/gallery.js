// Gallery page: hero featured artwork + masonry grid with filters & sort.

let allArtworks = [];
let currentCat = 'all';
let currentSort = 'recent';

async function init() {
  allArtworks = await loadArtworks();
  renderHero();
  render(false);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      render();
    });
  });

  document.getElementById('sort').addEventListener('change', e => {
    currentSort = e.target.value;
    render();
  });
}

function renderHero() {
  const slot = document.getElementById('hero-featured');
  if (!slot) return;
  // Pick a best-seller; fallback to most expensive available work.
  const featured = [...allArtworks]
    .filter(a => a.status === 'available')
    .sort((a, b) => (b.sales || 0) - (a.sales || 0) || b.price - a.price)[0];
  if (!featured) return;

  // Width 900 targets the hero-featured card at ~half viewport on large screens
  // (retina of ~450 display). The matching URL is preloaded in index.html head.
  const img = imageAt(featured.image, 900);
  slot.innerHTML = `
    <a class="hero-featured" href="artwork.html?id=${escapeHtml(featured.id)}">
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(featured.title)}"
           width="${img.width}" height="${img.height}"
           fetchpriority="high" decoding="sync" />
      <div class="hero-featured-label">
        <span>Œuvre mise en avant</span>
        <strong>${escapeHtml(featured.title)}</strong>
        <em>${formatPrice(featured.price)}</em>
      </div>
    </a>
  `;
}

function render(animate = true) {
  const gallery = document.getElementById('gallery');
  let list = allArtworks.filter(a => currentCat === 'all' || a.category === currentCat);

  switch (currentSort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'bestseller': list.sort((a, b) => (b.sales || 0) - (a.sales || 0)); break;
    case 'recent':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
  }

  const html = list.length
    ? list.map((a, i) => cardHTML(a, i)).join('')
    : `<p class="empty-state" style="column-span:all;">Aucune œuvre dans cette catégorie.</p>`;

  if (animate) {
    gallery.classList.add('fading');
    setTimeout(() => {
      gallery.innerHTML = html;
      gallery.classList.remove('fading');
    }, 180);
  } else {
    gallery.innerHTML = html;
  }
}

function cardHTML(a, i) {
  // Cards render ~300 CSS px wide on desktop (4-col masonry in 1280 container),
  // so 600 is the ideal retina size.
  const img = imageAt(a.image, 600);
  const tags = a.tags || [];
  const badges = `
    ${tags.includes('nouveau') ? '<span class="badge">Nouveau</span>' : ''}
    ${tags.includes('best-seller') ? '<span class="badge bestseller">Best-seller</span>' : ''}
  `;
  return `
    <a class="card" href="artwork.html?id=${escapeHtml(a.id)}" style="animation-delay:${i * 40}ms">
      <div class="card-badges">${badges}</div>
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(a.title)}"
           width="${img.width}" height="${img.height}"
           loading="lazy" decoding="async" />
      <div class="card-info">
        <h3>${escapeHtml(a.title)}</h3>
        <span class="price">${formatPrice(a.price)}</span>
      </div>
    </a>
  `;
}

init();
