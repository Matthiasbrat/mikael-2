// Contact form handler (loaded via <script src> at end of body on contact.html).
// Non-functional stub — the demo site has no backend. Shows a toast and resets.

(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.name.value || !form.email.value || !form.message.value) {
      showToast('Merci de remplir tous les champs.');
      return;
    }
    showToast('Message envoyé. Merci !');
    form.reset();
  });
})();
