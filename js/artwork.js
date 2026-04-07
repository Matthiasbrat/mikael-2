async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const artworks = await loadArtworks();
  const art = artworks.find(a => a.id === id);
  const root = document.getElementById('artwork-page');

  if (!art) {
    root.innerHTML = '<p style="padding:4rem 0;">Œuvre introuvable. <a href="index.html">Retour à la galerie</a></p>';
    return;
  }

  document.title = `${art.title} — Mikael's Gallery`;

  root.innerHTML = `
    <div class="artwork-media">
      <div class="main-image">
        <img src="${art.image}" alt="${art.title}" />
      </div>
      <div class="in-situ" aria-hidden="true">
        <div class="frame"><img src="${art.image}" alt="" /></div>
        <div class="lamp"></div>
      </div>
      <p class="in-situ-label">Aperçu en situation</p>
    </div>
    <div class="artwork-info">
      <h1>${art.title}</h1>
      <div class="meta">${art.category.charAt(0).toUpperCase() + art.category.slice(1)} · ${art.year}</div>
      <p class="description">${art.description}</p>
      <ul class="specs">
        <li><span>Dimensions</span><span>${art.dimensions}</span></li>
        <li><span>Technique</span><span>${art.technique}</span></li>
        <li><span>Année</span><span>${art.year}</span></li>
        <li><span>Disponibilité</span><span>${art.status === 'available' ? 'Disponible' : 'Vendue'}</span></li>
      </ul>
      <div class="price-tag">${formatPrice(art.price)}</div>
      <button class="btn" id="add-cart" ${art.status !== 'available' ? 'disabled' : ''}>
        ${art.status === 'available' ? 'Ajouter au panier' : 'Vendue'}
      </button>
    </div>
  `;

  document.getElementById('add-cart')?.addEventListener('click', () => addToCart(art.id));

  // Similar artworks
  const similar = artworks
    .filter(a => a.id !== art.id && a.category === art.category)
    .slice(0, 4);
  if (similar.length) {
    document.getElementById('similar').innerHTML = `
      <h2>Œuvres similaires</h2>
      <div class="gallery">
        ${similar.map(a => `
          <a class="card" href="artwork.html?id=${a.id}">
            <img src="${a.image}" alt="${a.title}" loading="lazy" />
            <div class="card-info">
              <h3>${a.title}</h3>
              <span class="price">${formatPrice(a.price)}</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }
}

init();
