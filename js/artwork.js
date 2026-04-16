const ROOM_SVG = `
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="room" aria-hidden="true">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#faf6ec"/>
      <stop offset="0.78" stop-color="#ece3cf"/>
      <stop offset="1" stop-color="#e0d5be"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9bb9f"/>
      <stop offset="1" stop-color="#8e7c5c"/>
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="15%" r="55%">
      <stop offset="0" stop-color="#fff7e0" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff7e0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="520" fill="url(#wall)"/>
  <rect width="800" height="520" fill="url(#spotlight)"/>
  <rect y="515" width="800" height="5" fill="#fff" opacity="0.55"/>
  <rect y="520" width="800" height="80" fill="url(#floor)"/>
  <rect y="520" width="800" height="2" fill="#000" opacity="0.12"/>
  <line x1="0" y1="560" x2="800" y2="560" stroke="#000" stroke-opacity="0.05"/>
</svg>
`;

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
  const situImg = imageAt(art.image, 500);
  const liked = isLiked(art.id);
  const isSold = art.status !== 'available';
  const cat = art.category[0].toUpperCase() + art.category.slice(1);

  root.innerHTML = `
    <div class="artwork-media">
      <a href="index.html" class="back-link">← Retour à la galerie</a>
      <div class="main-image">
        <img src="${escapeHtml(mainImg.url)}" alt="${escapeHtml(art.title)}"
             width="${mainImg.width}" height="${mainImg.height}"
             fetchpriority="high" decoding="sync" />
      </div>
      <div class="in-situ" role="group" aria-labelledby="in-situ-label">
        ${ROOM_SVG}
        <div class="frame">
          <img src="${escapeHtml(situImg.url)}" alt=""
               width="${situImg.width}" height="${situImg.height}"
               loading="lazy" decoding="async" />
        </div>
      </div>
      <p class="in-situ-label" id="in-situ-label">Aperçu en situation</p>
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

  // Adaptive frame sizing
  const frameImg = root.querySelector('.in-situ .frame img');
  const frame = root.querySelector('.in-situ .frame');
  const sizeFrame = () => {
    if (!frameImg.naturalWidth) return;
    const ratio = frameImg.naturalWidth / frameImg.naturalHeight;
    const k = 4 / 3;
    let w = 30, h = w * k / ratio;
    if (h > 56) { h = 56; w = h * ratio / k; }
    frame.style.width = w + '%';
    frame.style.height = h + '%';
  };
  if (frameImg.complete) sizeFrame(); else frameImg.addEventListener('load', sizeFrame);

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
