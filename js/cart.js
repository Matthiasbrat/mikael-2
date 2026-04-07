// Cart page: list, total, Stripe Checkout (with demo fallback to success.html).
//
// To enable real Stripe Checkout:
//   1. Create products & Prices in your Stripe Dashboard, store the price IDs in artworks.
//   2. Set STRIPE_PUBLIC_KEY below to your `pk_live_…` (or `pk_test_…`).
//   3. Add <script src="https://js.stripe.com/v3/"></script> to cart.html.
//   4. Uncomment the real `redirectToCheckout` block below.

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
            <a href="artwork.html?id=${escapeHtml(a.id)}">
              <img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}" />
            </a>
            <div>
              <h3><a href="artwork.html?id=${escapeHtml(a.id)}">${escapeHtml(a.title)}</a></h3>
              <div class="meta">${escapeHtml(a.dimensions)} · ${escapeHtml(a.technique)}</div>
            </div>
            <div class="price">${formatPrice(a.price)}</div>
            <button class="remove-btn" data-id="${escapeHtml(a.id)}" aria-label="Retirer">Retirer</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <div class="row"><span>Sous-total</span><span>${formatPrice(total)}</span></div>
        <div class="row"><span>Livraison</span><span>Offerte</span></div>
        <div class="row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn" id="checkout">Payer avec Stripe</button>
        <p class="cart-note">Paiement sécurisé via Stripe. Mode démo activé sur ce prototype.</p>
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
    if (STRIPE_PUBLIC_KEY.includes('REPLACE_ME')) {
      // Demo: simulate a successful checkout end-to-end.
      window.location.href = 'success.html?demo=1';
      return;
    }
    // Real Stripe (uncomment after configuring):
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
