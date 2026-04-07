// Shared utilities, data loading, cart management
const STORAGE_CART = 'mikael_cart';
const STORAGE_ARTWORKS = 'mikael_artworks';

async function loadArtworks() {
  // Prefer admin-edited data in localStorage if present
  const local = localStorage.getItem(STORAGE_ARTWORKS);
  if (local) {
    try { return JSON.parse(local); } catch (e) { /* fall through */ }
  }
  const res = await fetch('data/artworks.json');
  const data = await res.json();
  return data;
}

function saveArtworks(list) {
  localStorage.setItem(STORAGE_ARTWORKS, JSON.stringify(list));
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CART)) || [];
  } catch (e) { return []; }
}

function setCart(cart) {
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id) {
  const cart = getCart();
  if (!cart.includes(id)) {
    cart.push(id);
    setCart(cart);
    showToast('Œuvre ajoutée au panier');
  } else {
    showToast('Cette œuvre est déjà dans votre panier');
  }
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

function formatPrice(p) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p);
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

document.addEventListener('DOMContentLoaded', updateCartBadge);
