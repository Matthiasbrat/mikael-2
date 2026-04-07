// Stripe Checkout config — replace with your real public key & price IDs in production.
const STRIPE_PUBLIC_KEY = 'pk_test_REPLACE_ME';

async function init() {
  const artworks = await loadArtworks();
  const root = document.getElementById('cart-root');

  function render() {
    const ids = getCart();
    const items = ids.map(id => artworks.find(a => a.id === id)).filter(Boolean);

    if (!items.length) {
      root.innerHTML = `
        <div class="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Découvrez les œuvres disponibles dans la galerie.</p>
          <p style="margin-top:1.5rem;"><a class="btn" href="index.html">Voir la galerie</a></p>
        </div>`;
      return;
    }

    const total = items.reduce((s, a) => s + a.price, 0);
    root.innerHTML = `
      <div class="cart-list">
        ${items.map(a => `
          <div class="cart-item">
            <img src="${a.image}" alt="${a.title}" />
            <div>
              <h3>${a.title}</h3>
              <div class="meta">${a.dimensions} · ${a.technique}</div>
            </div>
            <div class="price">${formatPrice(a.price)}</div>
            <button class="remove-btn" data-id="${a.id}">Retirer</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <div class="row"><span>Sous-total</span><span>${formatPrice(total)}</span></div>
        <div class="row"><span>Livraison</span><span>Offerte</span></div>
        <div class="row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn" id="checkout">Payer avec Stripe</button>
      </div>
    `;

    root.querySelectorAll('.remove-btn').forEach(b => {
      b.addEventListener('click', () => {
        removeFromCart(b.dataset.id);
        render();
      });
    });

    document.getElementById('checkout').addEventListener('click', () => checkout(items));
  }

  function checkout(items) {
    // Client-only Stripe Checkout — requires real lineItems with Price IDs created in Stripe Dashboard.
    if (STRIPE_PUBLIC_KEY.includes('REPLACE_ME')) {
      showToast('Stripe non configuré (clé de test manquante)');
      return;
    }
    // Real implementation:
    // const stripe = Stripe(STRIPE_PUBLIC_KEY);
    // stripe.redirectToCheckout({
    //   lineItems: items.map(a => ({ price: a.stripePriceId, quantity: 1 })),
    //   mode: 'payment',
    //   successUrl: window.location.origin + '/success.html',
    //   cancelUrl: window.location.href,
    // });
  }

  render();
}

init();
