// Shared utilities: data loading, cart, formatting, toast, shared render helpers.

const STORAGE_CART = 'mikael_cart';
const STORAGE_ARTWORKS = 'mikael_artworks';

async function loadArtworks() {
  const local = localStorage.getItem(STORAGE_ARTWORKS);
  if (local) {
    try { return JSON.parse(local); } catch (_) { /* fall through to seed */ }
  }
  return Array.isArray(window.ARTWORKS) ? window.ARTWORKS.slice() : [];
}

function saveArtworks(list) {
  localStorage.setItem(STORAGE_ARTWORKS, JSON.stringify(list));
}

function resetArtworks() {
  localStorage.removeItem(STORAGE_ARTWORKS);
}

function getCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_CART)) || []; }
  catch (_) { return []; }
}

function setCart(cart) {
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem(STORAGE_CART);
  updateCartBadge();
}

function addToCart(id) {
  const cart = getCart();
  if (cart.includes(id)) {
    showToast('Cette œuvre est déjà dans votre panier');
    return;
  }
  cart.push(id);
  setCart(cart);
  showToast('Œuvre ajoutée au panier');
  bounceCartBadge();
}

function removeFromCart(id) {
  setCart(getCart().filter(x => x !== id));
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCart().length;
  badges.forEach(b => {
    b.textContent = count;
    b.classList.toggle('hidden', count === 0);
  });
}

function bounceCartBadge() {
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.classList.remove('bounce');
    // force reflow so the animation can restart
    void b.offsetWidth;
    b.classList.add('bounce');
  });
}

// Hoisted formatter — constructing a new Intl.NumberFormat on every call is
// expensive when rendering dozens of cards.
const PRICE_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatPrice(p) {
  return PRICE_FORMATTER.format(p);
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

// Minimal HTML escape for any user-supplied text we render via innerHTML.
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Picsum URL transformers: rewrite a picsum URL at the requested target width
// (preserving the original aspect ratio) or as a square crop.
// Returning { url, width, height } lets callers set <img> attributes in one shot.
function imageAt(imageUrl, targetWidth) {
  const m = String(imageUrl).match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/(\d+)\/(\d+)$/);
  if (!m) return { url: imageUrl, width: targetWidth, height: targetWidth };
  const width = targetWidth;
  const height = Math.round(targetWidth * Number(m[3]) / Number(m[2]));
  return { url: `${m[1]}/${width}/${height}`, width, height };
}

function imageSquare(imageUrl, size) {
  const m = String(imageUrl).match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\//);
  if (!m) return { url: imageUrl, width: size, height: size };
  return { url: `${m[1]}/${size}/${size}`, width: size, height: size };
}

// Shared presentation helpers — single source of truth for card rendering so
// gallery cards and "similar artworks" cards stay visually identical.

function artworkHref(id) {
  return `artwork.html?id=${encodeURIComponent(id)}`;
}

function badgesHTML(tags) {
  if (!tags || !tags.length) return '';
  const parts = [];
  if (tags.includes('nouveau')) parts.push('<span class="badge">Nouveau</span>');
  if (tags.includes('best-seller')) parts.push('<span class="badge bestseller">Best-seller</span>');
  return parts.join('');
}

function cardHTML(a, index = 0, opts = {}) {
  const { width = 600 } = opts;
  const img = imageAt(a.image, width);
  return `
    <a class="card" href="${artworkHref(a.id)}" style="animation-delay:${index * 40}ms">
      <div class="card-badges">${badgesHTML(a.tags)}</div>
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(a.title)}"
           width="${img.width}" height="${img.height}"
           loading="lazy" decoding="async" />
      <div class="card-info">
        <span class="card-title">${escapeHtml(a.title)}</span>
        <span class="price">${formatPrice(a.price)}</span>
      </div>
    </a>
  `;
}
