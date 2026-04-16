// Prototype admin: password is in plain text — for demo only.
// For production, gate this behind real auth on a backend.

const ADMIN_PASSWORD = 'mikael2026';
const SESSION_KEY = 'mikael_admin_session';

let artworks = [];

async function init() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showAdmin();
  }

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('password').addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('new-btn').addEventListener('click', () => openModal());
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('art-form').addEventListener('submit', saveArt);
  document.getElementById('f-upload').addEventListener('change', handleUpload);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('reset-btn').addEventListener('click', reset);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });

  // Delegate edit/delete clicks so re-renders don't need to rewire per-row listeners.
  document.getElementById('admin-rows').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) { openModal(editBtn.dataset.edit); return; }
    const delBtn = e.target.closest('[data-del]');
    if (delBtn) { deleteArt(delBtn.dataset.del); }
  });
}

function login() {
  const pwd = document.getElementById('password').value;
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showAdmin();
  } else {
    showToast('Mot de passe incorrect');
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

async function reset() {
  if (!confirm('Réinitialiser les œuvres avec les données de démo ? Vos modifications seront perdues.')) return;
  resetArtworks();
  artworks = await loadArtworks();
  renderStats();
  renderTable();
  showToast('Données réinitialisées');
}

async function showAdmin() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('admin-view').style.display = 'block';
  artworks = await loadArtworks();
  renderStats();
  renderTable();
}

function renderStats() {
  const totalSales = artworks.reduce((s, a) => s + (a.sales || 0), 0);
  const revenue = artworks.reduce((s, a) => s + (a.sales || 0) * a.price, 0);
  const available = artworks.filter(a => a.status === 'available').length;
  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="label">Œuvres</div><div class="value">${artworks.length}</div></div>
    <div class="stat-card"><div class="label">Disponibles</div><div class="value">${available}</div></div>
    <div class="stat-card"><div class="label">Ventes</div><div class="value">${totalSales}</div></div>
    <div class="stat-card"><div class="label">Revenus</div><div class="value">${formatPrice(revenue)}</div></div>
  `;
}

function renderTable() {
  // Listeners are delegated on #admin-rows in init(), no per-row wiring here.
  const rows = artworks.map(a => {
    const thumb = imageSquare(a.image, 100);
    return `
    <tr>
      <td><img src="${escapeHtml(thumb.url)}" alt="" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async" /></td>
      <td>${escapeHtml(a.title)}</td>
      <td>${escapeHtml(a.category)}</td>
      <td>${formatPrice(a.price)}</td>
      <td>${a.status === 'available' ? 'Disponible' : 'Vendue'}</td>
      <td>${a.sales || 0}</td>
      <td>
        <div class="admin-actions">
          <button class="icon-btn" data-edit="${escapeHtml(a.id)}">Modifier</button>
          <button class="icon-btn danger" data-del="${escapeHtml(a.id)}">Supprimer</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
  document.getElementById('admin-rows').innerHTML = rows;
}

function openModal(id) {
  const art = id ? artworks.find(a => a.id === id) : null;
  document.getElementById('modal-title').textContent = art ? "Modifier l'œuvre" : 'Nouvelle œuvre';
  document.getElementById('f-id').value = art?.id || '';
  document.getElementById('f-title').value = art?.title || '';
  document.getElementById('f-description').value = art?.description || '';
  document.getElementById('f-category').value = art?.category || 'paysage';
  document.getElementById('f-medium').value = art?.medium || 'Peinture';
  document.getElementById('f-dimensions').value = art?.dimensions || '';
  document.getElementById('f-technique').value = art?.technique || '';
  document.getElementById('f-year').value = art?.year || new Date().getFullYear();
  document.getElementById('f-price').value = art?.price || '';
  document.getElementById('f-image').value = art?.image || '';
  document.getElementById('f-status').value = art?.status || 'available';
  document.getElementById('f-tag-new').checked = (art?.tags || []).includes('nouveau');
  document.getElementById('f-tag-best').checked = (art?.tags || []).includes('best-seller');
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function handleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('f-image').value = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function saveArt(e) {
  e.preventDefault();
  const id = document.getElementById('f-id').value;
  const tags = [];
  if (document.getElementById('f-tag-new').checked) tags.push('nouveau');
  if (document.getElementById('f-tag-best').checked) tags.push('best-seller');

  const yearInput = parseInt(document.getElementById('f-year').value, 10);
  const priceInput = parseFloat(document.getElementById('f-price').value);

  // Editable fields only — sales + createdAt are NOT in here so an edit
  // can't accidentally reset them.
  const editable = {
    title: document.getElementById('f-title').value,
    description: document.getElementById('f-description').value,
    category: document.getElementById('f-category').value,
    medium: document.getElementById('f-medium').value,
    dimensions: document.getElementById('f-dimensions').value,
    technique: document.getElementById('f-technique').value,
    year: Number.isFinite(yearInput) ? yearInput : new Date().getFullYear(),
    price: Number.isFinite(priceInput) ? priceInput : 0,
    image: document.getElementById('f-image').value || `https://picsum.photos/seed/${Date.now()}/800/1000`,
    status: document.getElementById('f-status').value,
    tags,
  };

  if (id) {
    const idx = artworks.findIndex(a => a.id === id);
    if (idx === -1) {
      showToast('Œuvre introuvable');
      return;
    }
    artworks[idx] = { ...artworks[idx], ...editable };
  } else {
    artworks.unshift({
      ...editable,
      id: String(Date.now()),
      sales: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }
  saveArtworks(artworks);
  closeModal();
  renderStats();
  renderTable();
  showToast(id ? 'Œuvre modifiée' : 'Œuvre ajoutée');
}

function deleteArt(id) {
  if (!confirm('Supprimer cette œuvre ?')) return;
  artworks = artworks.filter(a => a.id !== id);
  saveArtworks(artworks);
  renderStats();
  renderTable();
  showToast('Œuvre supprimée');
}

init();
