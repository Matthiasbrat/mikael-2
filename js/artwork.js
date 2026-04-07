// Artwork detail page: hero image, in-situ scene with adaptive frame, specs, similar.

const ROOM_SVG = `
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" class="room" aria-hidden="true">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbf8f3"/>
      <stop offset="1" stop-color="#ece4d4"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c9b59a"/>
      <stop offset="1" stop-color="#9c8568"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="20%" r="60%">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Wall -->
  <rect width="800" height="430" fill="url(#wall)"/>
  <rect width="800" height="430" fill="url(#sun)"/>

  <!-- Floor -->
  <rect y="430" width="800" height="170" fill="url(#floor)"/>
  <line x1="0" y1="475" x2="800" y2="475" stroke="#000" stroke-opacity="0.07"/>
  <line x1="0" y1="525" x2="800" y2="525" stroke="#000" stroke-opacity="0.05"/>
  <line x1="0" y1="575" x2="800" y2="575" stroke="#000" stroke-opacity="0.04"/>

  <!-- Baseboard -->
  <rect y="425" width="800" height="6" fill="#fff" opacity="0.7"/>

  <!-- Sofa shadow -->
  <ellipse cx="400" cy="558" rx="240" ry="12" fill="#000" opacity="0.18"/>

  <!-- Sofa -->
  <rect x="180" y="445" width="440" height="105" rx="18" fill="#5b6776"/>
  <rect x="195" y="435" width="410" height="48" rx="14" fill="#6c7888"/>
  <rect x="220" y="450" width="55" height="38" rx="6" fill="#8593a3" opacity="0.85"/>
  <rect x="525" y="450" width="55" height="38" rx="6" fill="#a8b3c2" opacity="0.75"/>
  <rect x="200" y="548" width="6" height="14" fill="#2a2a2a"/>
  <rect x="594" y="548" width="6" height="14" fill="#2a2a2a"/>

  <!-- Side table -->
  <rect x="68" y="495" width="92" height="65" fill="#7a624a"/>
  <rect x="65" y="488" width="98" height="9" fill="#8e7459"/>
  <rect x="78" y="555" width="5" height="12" fill="#3a2e22"/>
  <rect x="145" y="555" width="5" height="12" fill="#3a2e22"/>

  <!-- Plant on table -->
  <rect x="100" y="455" width="36" height="35" rx="3" fill="#e3d8c2"/>
  <path d="M118 455 q-22 -45 -10 -82 q5 40 10 82 z" fill="#6b8a5d"/>
  <path d="M118 455 q24 -38 14 -70 q-9 32 -14 70 z" fill="#7a9a6c"/>
  <path d="M118 455 q-2 -55 6 -60 q-3 33 -6 60 z" fill="#5e7d51"/>

  <!-- Floor lamp -->
  <ellipse cx="715" cy="563" rx="32" ry="6" fill="#000" opacity="0.18"/>
  <rect x="712" y="290" width="6" height="270" fill="#2d2d2d"/>
  <ellipse cx="715" cy="560" rx="22" ry="4" fill="#2d2d2d"/>
  <path d="M688 290 L742 290 L730 245 L700 245 Z" fill="#f0e3c8"/>
  <ellipse cx="715" cy="320" rx="60" ry="80" fill="#fff5d8" opacity="0.3"/>
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
      <div class="in-situ" aria-label="Aperçu en situation de l'œuvre">
        ${ROOM_SVG}
        <div class="frame">
          <img src="${escapeHtml(situImg.url)}" alt=""
               width="${situImg.width}" height="${situImg.height}"
               loading="lazy" decoding="async" />
        </div>
      </div>
      <p class="in-situ-label">Aperçu en situation</p>
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
        ${similar.map(a => {
          const img = imageAt(a.image, 600);
          return `
            <a class="card" href="artwork.html?id=${escapeHtml(a.id)}">
              <img src="${escapeHtml(img.url)}" alt="${escapeHtml(a.title)}"
                   width="${img.width}" height="${img.height}"
                   loading="lazy" decoding="async" />
              <div class="card-info">
                <h3>${escapeHtml(a.title)}</h3>
                <span class="price">${formatPrice(a.price)}</span>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    `;
  }
}

init();
