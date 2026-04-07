// Gallery page: hero featured artwork + masonry grid with filters & sort.

let allArtworks = [];
let currentCat = 'all';
let currentSort = 'recent';

async function init() {
  allArtworks = await loadArtworks();
  renderHero();
  render(false);

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
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
  // Top-selling available work; ties broken by highest price.
  const featured = [...allArtworks]
    .filter(a => a.status === 'available')
    .sort((a, b) => (b.sales || 0) - (a.sales || 0) || b.price - a.price)[0];
  if (!featured) return;

  // Width 900 targets the hero-featured card at ~half viewport on large screens.
  // The matching URL is preloaded in index.html head.
  const img = imageAt(featured.image, 900);
  slot.innerHTML = `
    <a class="hero-featured" href="${artworkHref(featured.id)}">
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

init();
