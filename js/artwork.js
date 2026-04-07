// Artwork detail page: hero image, in-situ scene with adaptive frame, specs, similar.

// Minimalist gallery-wall scene. No furniture — just a warm wall lit by a soft
// spotlight from above, a thin floor strip, and the frame (positioned separately
// by CSS) hovering in the lit area. Matches the sober brand better than a
// cartoonish living room.
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
    return;
  }

  document.title = `${art.title} — Mikael's Gallery`;

  // Main image is the LCP element on this page → fetchpriority high + decoding sync.
  // In-situ frame is below the fold and small → lazy + async decode.
  const mainImg = imageAt(art.image, 1200);
  const situImg = imageAt(art.image, 500);

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
        ${(art.tags || []).map(t => t === 'nouveau'
          ? '<span class="badge">Nouveau</span>'
          : t === 'best-seller'
            ? '<span class="badge bestseller">Best-seller</span>'
            : '').join(' ')}
      </div>
      <h1>${escapeHtml(art.title)}</h1>
      <div class="meta">${escapeHtml(art.category[0].toUpperCase() + art.category.slice(1))} · ${art.year}</div>
      <p class="description">${escapeHtml(art.description)}</p>
      <ul class="specs">
        <li><span>Dimensions</span><span>${escapeHtml(art.dimensions)}</span></li>
        <li><span>Technique</span><span>${escapeHtml(art.technique)}</span></li>
        <li><span>Année</span><span>${art.year}</span></li>
        <li><span>Disponibilité</span><span>${art.status === 'available' ? 'Disponible' : 'Vendue'}</span></li>
      </ul>
      <div class="price-tag">${formatPrice(art.price)}</div>
      <button class="btn" id="add-cart" ${art.status !== 'available' ? 'disabled' : ''}>
        ${art.status === 'available' ? 'Ajouter au panier' : 'Vendue'}
      </button>
    </div>
  `;

  root.setAttribute('aria-busy', 'false');
  document.getElementById('add-cart')?.addEventListener('click', () => addToCart(art.id));

  // Adaptive frame sizing based on artwork aspect ratio.
  const frameImg = root.querySelector('.in-situ .frame img');
  const frame = root.querySelector('.in-situ .frame');
  const sizeFrame = () => {
    if (!frameImg.naturalWidth) return;
    const ratio = frameImg.naturalWidth / frameImg.naturalHeight;
    // Container aspect 4:3 (CW/CH = 4/3). Frame width w% and height h%
    // satisfy h% = w% * (4/3) / ratio.
    const k = 4 / 3;
    const maxW = 30;  // % of container width
    const maxH = 56;  // % of container height
    let w = maxW;
    let h = w * k / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio / k;
    }
    frame.style.width = w + '%';
    frame.style.height = h + '%';
  };
  if (frameImg.complete) sizeFrame();
  else frameImg.addEventListener('load', sizeFrame);

  // Similar artworks
  const similar = artworks
    .filter(a => a.id !== art.id && a.category === art.category)
    .slice(0, 4);
  const similarRoot = document.getElementById('similar');
  if (similar.length) {
    similarRoot.innerHTML = `
      <h2>Œuvres similaires</h2>
      <div class="gallery">
        ${similar.map((a, i) => cardHTML(a, i)).join('')}
      </div>
    `;
  }
}

init();
