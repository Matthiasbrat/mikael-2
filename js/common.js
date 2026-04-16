// Shared utilities: data, cart, likes, formatting, card rendering.

const STORAGE_CART = 'mikael_cart';
const STORAGE_ARTWORKS = 'mikael_artworks';
const STORAGE_LIKES = 'mikael_likes';

// ---------- Data ----------
async function loadArtworks() {
  const local = localStorage.getItem(STORAGE_ARTWORKS);
  if (local) { try { return JSON.parse(local); } catch (_) {} }
  return Array.isArray(window.ARTWORKS) ? window.ARTWORKS.slice() : [];
}
function saveArtworks(list) { localStorage.setItem(STORAGE_ARTWORKS, JSON.stringify(list)); }
function resetArtworks() { localStorage.removeItem(STORAGE_ARTWORKS); }

// ---------- Cart ----------
function getCart() { try { return JSON.parse(localStorage.getItem(STORAGE_CART)) || []; } catch (_) { return []; } }
function setCart(cart) { localStorage.setItem(STORAGE_CART, JSON.stringify(cart)); updateCartBadge(); }
function clearCart() { localStorage.removeItem(STORAGE_CART); updateCartBadge(); }

function addToCart(id) {
  const cart = getCart();
  if (cart.includes(id)) { showToast('Déjà dans le panier'); return; }
  cart.push(id);
  setCart(cart);
  showToast('Ajouté au panier');
}
function removeFromCart(id) { setCart(getCart().filter(x => x !== id)); }

function updateCartBadge() {
  const count = getCart().length;
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = `(${count})`;
    b.classList.toggle('hidden', count === 0);
  });
}

// ---------- Likes ----------
function getLikes() { try { return JSON.parse(localStorage.getItem(STORAGE_LIKES)) || []; } catch (_) { return []; } }
function isLiked(id) { return getLikes().includes(id); }

function toggleLike(id) {
  const likes = getLikes();
  const idx = likes.indexOf(id);
  if (idx === -1) likes.push(id); else likes.splice(idx, 1);
  localStorage.setItem(STORAGE_LIKES, JSON.stringify(likes));
  updateLikesBadge();
  return idx === -1;
}

function updateLikesBadge() {
  const count = getLikes().length;
  document.querySelectorAll('.likes-badge').forEach(b => {
    b.textContent = `(${count})`;
    b.classList.toggle('hidden', count === 0);
  });
}

// ---------- Formatting ----------
const PRICE_FMT = new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });
function formatPrice(p) { return PRICE_FMT.format(p); }

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ---------- Image helpers ----------
function imageAt(imageUrl, targetWidth) {
  const m = String(imageUrl).match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/(\d+)\/(\d+)$/);
  if (!m) return { url: imageUrl, width: targetWidth, height: targetWidth };
  const w = targetWidth, h = Math.round(targetWidth * Number(m[3]) / Number(m[2]));
  return { url: `${m[1]}/${w}/${h}`, width: w, height: h };
}
function imageSquare(imageUrl, size) {
  const m = String(imageUrl).match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\//);
  if (!m) return { url: imageUrl, width: size, height: size };
  return { url: `${m[1]}/${size}/${size}`, width: size, height: size };
}

// ---------- Shared card renderer ----------
const HEART_SVG = `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

function artworkHref(id) { return `artwork.html?id=${encodeURIComponent(id)}`; }

function cardHTML(a, index = 0) {
  const img = imageAt(a.image, 600);
  const liked = isLiked(a.id);
  const isSold = a.status !== 'available';
  return `
    <div class="card" style="animation-delay:${index * 50}ms">
      <a href="${artworkHref(a.id)}" class="card-image">
        <img src="${escapeHtml(img.url)}" alt="${escapeHtml(a.title)}"
             width="${img.width}" height="${img.height}"
             loading="lazy" decoding="async" />
        <span class="status-dot${isSold ? ' sold' : ''}">${isSold ? 'Vendu' : 'Disponible'}</span>
      </a>
      <button class="heart-btn${liked ? ' liked' : ''}" data-id="${escapeHtml(a.id)}" aria-label="Ajouter aux favoris">
        ${HEART_SVG}
      </button>
      <a href="${artworkHref(a.id)}" class="card-body">
        <span class="card-title">${escapeHtml(a.title)}</span>
        <span class="card-dims">${escapeHtml(a.dimensions)}</span>
        <span class="card-price">${formatPrice(a.price)}</span>
      </a>
    </div>
  `;
}
