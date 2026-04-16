const STRIPE_PUBLIC_KEY = 'pk_test_REPLACE_ME';

async function init() {
  const artworks = await loadArtworks();
  const root = document.getElementById('cart-root');

  root.addEventListener('click', e => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) { removeFromCart(removeBtn.dataset.id); render(); return; }
    if (e.target.closest('#checkout')) handleCheckout();
  });

  function render() {
    const ids = getCart();
    const items = ids.map(id => artworks.find(a => a.id === id)).filter(Boolean);
    if (items.length !== ids.length) setCart(items.map(a => a.id));

    if (!items.length) {
      root.innerHTML = `
        <div class="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Découvrez les œuvres dans la galerie.</p>
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
                   width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async" />
            </a>
            <div>
              <h2><a href="${artworkHref(a.id)}">${escapeHtml(a.title)}</a></h2>
              <div class="meta">${escapeHtml(a.dimensions)} · ${escapeHtml(a.technique)}</div>
            </div>
            <div class="price">${formatPrice(a.price)}</div>
            <button class="remove-btn" data-id="${escapeHtml(a.id)}" aria-label="Retirer ${escapeHtml(a.title)}">Retirer</button>
          </div>`;
        }).join('')}
      </div>
      <div class="cart-summary">
        <div class="row"><span>Sous-total</span><span>${formatPrice(total)}</span></div>
        <div class="row"><span>Livraison</span><span>Offerte</span></div>
        <div class="row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <button class="btn btn-lg" id="checkout">Payer</button>
        <div class="payment-methods">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            Carte bancaire
          </span>
          <span>·</span>
          <span>TWINT</span>
        </div>
        <p class="cart-note">Paiement sécurisé. Mode démo sur ce prototype.</p>
      </div>
    `;
  }

  function handleCheckout() {
    if (STRIPE_PUBLIC_KEY.includes('REPLACE_ME')) {
      window.location.href = 'success.html?demo=1';
      return;
    }
    // Stripe Checkout supports both card and TWINT via payment_method_types.
    // const stripe = Stripe(STRIPE_PUBLIC_KEY);
    // stripe.redirectToCheckout({
    //   lineItems: [...],
    //   mode: 'payment',
    //   payment_method_types: ['card', 'twint'],
    //   successUrl: window.location.origin + '/success.html',
    //   cancelUrl: window.location.href,
    // });
  }

  render();
}

init();
