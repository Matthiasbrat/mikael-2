let allArtworks = [];
let currentCat = 'all';
let currentSort = 'recent';

async function init() {
  allArtworks = await loadArtworks();
  render();

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

function render() {
  const gallery = document.getElementById('gallery');
  let list = allArtworks.filter(a => currentCat === 'all' || a.category === currentCat);

  switch (currentSort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'bestseller': list.sort((a, b) => (b.sales || 0) - (a.sales || 0)); break;
    case 'recent':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
  }

  gallery.innerHTML = list.map((a, i) => `
    <a class="card" href="artwork.html?id=${a.id}" style="animation-delay:${i * 40}ms">
      <div class="card-badges">
        ${(a.tags || []).includes('nouveau') ? '<span class="badge">Nouveau</span>' : ''}
        ${(a.tags || []).includes('best-seller') ? '<span class="badge bestseller">Best-seller</span>' : ''}
      </div>
      <img src="${a.image}" alt="${a.title}" loading="lazy" />
      <div class="card-info">
        <h3>${a.title}</h3>
        <span class="price">${formatPrice(a.price)}</span>
      </div>
    </a>
  `).join('');
}

init();
