// Injects the shared header & footer into mount points (#site-header, #site-footer).
// Single source of truth for navigation, eliminating per-page duplication.

(function () {
  const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isActive = href => path === href ? 'active' : '';

  const cartIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>`;

  const headerHTML = `
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="brand">Mikael's Gallery</a>
        <button class="nav-toggle" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="main-nav">
          <span></span><span></span><span></span>
        </button>
        <nav class="nav" id="main-nav">
          <a href="index.html" class="${isActive('index.html')}">Galerie</a>
          <a href="about.html" class="${isActive('about.html')}">À propos</a>
          <a href="contact.html" class="${isActive('contact.html')}">Contact</a>
          <a href="cart.html" class="cart-link ${isActive('cart.html')}" aria-label="Panier">
            ${cartIcon}
            <span class="cart-badge hidden">0</span>
          </a>
        </nav>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-col">
          <div class="footer-brand">Mikael's Gallery</div>
          <p class="footer-tag">Life under a new angle.</p>
        </div>
        <div class="footer-col">
          <h4>Navigation</h4>
          <a href="index.html">Galerie</a>
          <a href="about.html">À propos</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="footer-col">
          <h4>Studio</h4>
          <a href="mailto:hello@mikaelsgallery.art">hello@mikaelsgallery.art</a>
          <a href="admin.html">Espace admin</a>
        </div>
        <div class="footer-col">
          <h4>Suivre</h4>
          <a href="#">Instagram</a>
          <a href="#">Behance</a>
          <a href="#">Vimeo</a>
        </div>
      </div>
      <div class="footer-copy container">© 2026 Mikael's Gallery — Tous droits réservés</div>
    </footer>
  `;

  function mount() {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) h.outerHTML = headerHTML;
    if (f) f.outerHTML = footerHTML;

    // Ensure the skip link has a target.
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';

    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      // Close on link click (mobile)
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    if (typeof updateCartBadge === 'function') updateCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
