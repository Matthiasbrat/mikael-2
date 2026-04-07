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
  const rows = artworks.map(a => `
    <tr>
      <td><img src="${escapeHtml(a.image)}" alt="" /></td>
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
  `).join('');
  document.getElementById('admin-rows').innerHTML = rows;

  document.querySelectorAll('[data-edit]').forEach(b => {
    b.addEventListener('click', () => openModal(b.dataset.edit));
  });
  document.querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', () => deleteArt(b.dataset.del));
  });
}

function openModal(id) {
  const art = id ? artworks.find(a => a.id === id) : null;
  document.getElementById('modal-title').textContent = art ? "Modifier l'œuvre" : 'Nouvelle œuvre';
  document.getElementById('f-id').value = art?.id || '';
  document.getElementById('f-title').value = art?.title || '';
  document.getElementById('f-description').value = art?.description || '';
  document.getElementById('f-category').value = art?.category || 'paysage';
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

  const data = {
    id: id || String(Date.now()),
    title: document.getElementById('f-title').value,
    description: document.getElementById('f-description').value,
    category: document.getElementById('f-category').value,
    dimensions: document.getElementById('f-dimensions').value,
    technique: document.getElementById('f-technique').value,
    year: parseInt(document.getElementById('f-year').value, 10),
    price: parseFloat(document.getElementById('f-price').value),
    image: document.getElementById('f-image').value || 'https://picsum.photos/seed/' + Date.now() + '/800/1000',
    status: document.getElementById('f-status').value,
    tags,
    sales: 0,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (id) {
    const idx = artworks.findIndex(a => a.id === id);
    artworks[idx] = { ...artworks[idx], ...data };
  } else {
    artworks.unshift(data);
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
