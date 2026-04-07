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

  // Delegate clicks on the root so re-renders don't drop listeners.
  root.addEventListener('click', e => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.id);
      render();
      return;
    }
    if (e.target.closest('#checkout')) {
      handleCheckout();
    }
  });

  function render() {
    const ids = getCart();
    const items = ids.map(id => artworks.find(a => a.id === id)).filter(Boolean);

    // Prune cart ids whose artwork was deleted in admin so the badge count
    // stays in sync with the rendered list.
    if (items.length !== ids.length) {
      setCart(items.map(a => a.id));
    }

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
        ${items.map(a => {
          const thumb = imageSquare(a.image, 220);
          return `
          <div class="cart-item">
            <a href="${artworkHref(a.id)}">
              <img src="${escapeHtml(thumb.url)}" alt="${escapeHtml(a.title)}"
                   width="${thumb.width}" height="${thumb.height}"
                   loading="lazy" decoding="async" />
            </a>
            <div>
              <h2><a href="${artworkHref(a.id)}">${escapeHtml(a.title)}</a></h2>
              <div class="meta">${escapeHtml(a.dimensions)} · ${escapeHtml(a.technique)}</div>
            </div>
            <div class="price">${formatPrice(a.price)}</div>
            <button class="remove-btn" data-id="${escapeHtml(a.id)}" aria-label="Retirer ${escapeHtml(a.title)}">Retirer</button>
          </div>
        `;
        }).join('')}
      </div>
      <div class="cart-summary">
        <div class="row"><span>Sous-total</span><span>${formatPrice(total)}</span></div>
        <div class="row"><span>Livraison</span><span>Offerte</span></div>
        <div class="row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn" id="checkout">Payer avec Stripe</button>
        <p class="cart-note">Paiement sécurisé via Stripe. Mode démo activé sur ce prototype.</p>
      </div>
    `;
  }

  function handleCheckout() {
    if (STRIPE_PUBLIC_KEY.includes('REPLACE_ME')) {
      window.location.href = 'success.html?demo=1';
      return;
    }
    // Real Stripe (uncomment after configuring):
    // const stripe = Stripe(STRIPE_PUBLIC_KEY);
    // stripe.redirectToCheckout({
    //   lineItems: getCart().map(id => ({ price: /* priceIdFor(id) */, quantity: 1 })),
    //   mode: 'payment',
    //   successUrl: window.location.origin + '/success.html',
    //   cancelUrl: window.location.href,
    // });
  }

  render();
}

init();
