function loadScriptOnce(src) {
  return new Promise(function (resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = function () { reject(new Error('Failed to load: ' + src)); };
    document.head.appendChild(s);
  });
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const artworks = await loadArtworks();
  const art = artworks.find(a => a.id === id);
  const root = document.getElementById('artwork-page');

  if (!art) {
    root.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h2>Œuvre introuvable</h2>
        <p style="margin-top:1rem;"><a class="btn" href="index.html">Retour à la galerie</a></p>
      </div>`;
    root.setAttribute('aria-busy', 'false');
    return;
  }

  document.title = `${art.title} — Mikael's Gallery`;
  const mainImg = imageAt(art.image, 1200);
  const liked = isLiked(art.id);
  const isSold = art.status !== 'available';
  const cat = art.category[0].toUpperCase() + art.category.slice(1);

  root.innerHTML = `
    <div class="artwork-media">
      <a href="index.html" class="back-link">← Retour à la galerie</a>
      <div class="main-image">
        <img src="${escapeHtml(mainImg.url)}" alt="${escapeHtml(art.title)}"
             width="${mainImg.width}" height="${mainImg.height}"
             crossorigin="anonymous"
             fetchpriority="high" decoding="sync" />
      </div>
      <div id="viewer-3d-inline" class="viewer-inline">
        <p class="viewer-loading">Chargement 3D...</p>
      </div>
      <p class="viewer-hint-inline">Glisser pour tourner · Pincer pour zoomer</p>
    </div>
    <div class="artwork-info">
      <div class="artwork-tags">
        ${(art.tags || []).includes('nouveau') ? '<span class="active-tag" style="font-size:0.72rem;">Nouveau</span>' : ''}
        ${(art.tags || []).includes('best-seller') ? '<span class="active-tag" style="font-size:0.72rem;background:var(--accent);color:#fff;">Best-seller</span>' : ''}
      </div>
      <h1>${escapeHtml(art.title)}</h1>
      <div class="meta">${escapeHtml(cat)} · ${escapeHtml(art.medium)} · ${art.year}</div>
      <p class="description">${escapeHtml(art.description)}</p>
      <ul class="specs">
        <li><span>Dimensions</span><span>${escapeHtml(art.dimensions)}</span></li>
        <li><span>Technique</span><span>${escapeHtml(art.technique)}</span></li>
        <li><span>Année</span><span>${art.year}</span></li>
        <li><span>Disponibilité</span><span style="color:${isSold ? 'var(--sold)' : 'var(--available)'}; font-weight:600;">${isSold ? 'Vendu' : 'Disponible'}</span></li>
      </ul>
      <div class="price-tag">${formatPrice(art.price)}</div>
      <div class="artwork-actions">
        <button class="btn btn-lg" id="add-cart" ${isSold ? 'disabled' : ''}>
          ${isSold ? 'Vendu' : 'Ajouter au panier'}
        </button>
        <button class="heart-btn-lg${liked ? ' liked' : ''}" id="like-btn" aria-label="Ajouter aux favoris">
          ${HEART_SVG}
        </button>
      </div>
    </div>
  `;

  root.setAttribute('aria-busy', 'false');

  document.getElementById('add-cart')?.addEventListener('click', () => addToCart(art.id));

  document.getElementById('like-btn')?.addEventListener('click', function () {
    const liked = toggleLike(art.id);
    this.classList.toggle('liked', liked);
    showToast(liked ? 'Ajouté aux favoris' : 'Retiré des favoris');
  });

  // Load 3D viewer inline (no button click needed)
  try {
    await loadScriptOnce(new URL('lib/three.min.js', document.baseURI).href);
    await loadScriptOnce(new URL('js/viewer3d.js', document.baseURI).href + '?t=' + Date.now());
    var dims = art.dimensions.match(/(\d+)\s*[×x]\s*(\d+)/);
    var w = dims ? +dims[1] : mainImg.width;
    var h = dims ? +dims[2] : mainImg.height;
    window.init3DViewer('viewer-3d-inline', mainImg.url, w, h);
  } catch (err) {
    var el = document.getElementById('viewer-3d-inline');
    if (el) el.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--muted);">Vue 3D indisponible</p>';
  }

  // Similar artworks
  const similar = artworks.filter(a => a.id !== art.id && a.category === art.category).slice(0, 4);
  const similarRoot = document.getElementById('similar');
  if (similar.length) {
    similarRoot.innerHTML = `
      <h2>Œuvres similaires</h2>
      <div class="gallery">${similar.map((a, i) => cardHTML(a, i)).join('')}</div>
    `;
    similarRoot.addEventListener('click', e => {
      const heart = e.target.closest('.heart-btn');
      if (heart) {
        e.preventDefault();
        e.stopPropagation();
        const liked = toggleLike(heart.dataset.id);
        heart.classList.toggle('liked', liked);
      }
    });
  }
}

init();
