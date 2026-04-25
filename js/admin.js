// ============================================================
// DESACT STUDIOS — Admin Panel JS
// ============================================================

const API_BASE = (window.DESACT_CONFIG && window.DESACT_CONFIG.API_BASE) || 'http://localhost:3000';
let API_KEY = '';

/* ── Helpers ── */
function showToast(msg, duration = 3500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('📋 Copied!'));
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...(opts.headers || {})
    }
  });
  return res.json();
}

/* ── Login ── */
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('apiKeyInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) { document.getElementById('loginError').textContent = 'Please enter your API key.'; return; }
  API_KEY = key;
  try {
    const data = await apiFetch('/api/licenses/info/test-key-check');
    // If 401 → wrong key
    if (data && data.message && data.message.toLowerCase().includes('unauthorized')) {
      document.getElementById('loginError').textContent = '✗ Invalid API key.';
      API_KEY = '';
      return;
    }
    // Success (any response other than 401)
    enterDashboard();
  } catch (e) {
    // Network error – still let in if backend is down
    document.getElementById('loginError').textContent = '✗ Cannot reach backend (is it running on port 3000?)';
    API_KEY = '';
  }
}

function enterDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadOverview();
}

/* ── Logout ── */
document.getElementById('logoutBtn').addEventListener('click', () => {
  API_KEY = '';
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('apiKeyInput').value = '';
  document.getElementById('loginError').textContent = '';
});

/* ── Tab Navigation ── */
const tabTitles = { overview: 'Overview', licenses: 'Licenses', generate: 'Manage Licenses', logs: 'Logs', apikeys: 'API Keys' };
document.querySelectorAll('.sidebar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById('dashTitle').textContent = tabTitles[tab] || tab;
    if (tab === 'overview') loadOverview();
    if (tab === 'licenses') loadLicenses();
    if (tab === 'products') loadProducts();
    if (tab === 'logs') loadLogs();
    if (tab === 'apikeys') loadApiKeys();
  });
});

/* ── Overview ── */
async function loadOverview() {
  try {
    // Try to get all licenses — use a broad user search hack (get user stats)
    // We'll fetch from /api/licenses/info which won't give all, so we build from logs
    // Actually let's try the generate route (admin can see all)
    // Best approach: call /api/licenses/user/ALL workaround doesn't exist
    // So we do a little trick: load recent logs and count
    const logsData = await apiFetch('/api/licenses/logs?limit=200');
    const licenses = await apiFetch('/api/licenses/all');
    const products = await apiFetch('/api/products/all');

    // Update stats if endpoint exists
    if (licenses && licenses.licenses) {
      const all = licenses.licenses;
      document.getElementById('s-total').textContent   = all.length;
      document.getElementById('s-active').textContent  = all.filter(l => l.status === 'active').length;
      document.getElementById('s-revoked').textContent = all.filter(l => l.status === 'revoked').length;
      document.getElementById('s-expired').textContent = all.filter(l => l.status === 'expired').length;
      renderLicenseTable('recentLicenses', all.slice(-10).reverse(), true);
    }
    
    if (products && products.products) {
      document.getElementById('s-products').textContent = products.products.length;
    }
  } catch (e) {
    ['s-total','s-active','s-revoked','s-expired'].forEach(id => document.getElementById(id).textContent = '?');
  }
}

/* ── Licenses Tab ── */
window.loadLicenses = async function() {
  const el = document.getElementById('licensesTable');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const data = await apiFetch('/api/licenses/all');
    if (data && data.licenses) {
      const search = document.getElementById('licSearchInput').value.toLowerCase();
      const filtered = search
        ? data.licenses.filter(l =>
            (l.key||'').toLowerCase().includes(search) ||
            (l.product_name||'').toLowerCase().includes(search) ||
            (l.bound_ip||'').toLowerCase().includes(search) ||
            (l.user_id||'').toLowerCase().includes(search))
        : data.licenses;
      renderLicenseTable('licensesTable', filtered.reverse(), false);
    } else {
      el.innerHTML = `<div class="empty-state">Could not load licenses. Make sure you have a GET /api/licenses endpoint.</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
};

document.getElementById('licSearchInput').addEventListener('input', loadLicenses);

function renderLicenseTable(containerId, licenses, compact) {
  const el = document.getElementById(containerId);
  if (!licenses || licenses.length === 0) {
    el.innerHTML = '<div class="empty-state">No licenses found.</div>';
    return;
  }
  const rows = licenses.map(l => `
    <tr>
      <td><span class="mono">${l.key}</span></td>
      <td>${l.product_name || '—'}</td>
      <td><span class="badge badge-${l.status}">${l.status}</span></td>
      <td><span class="mono">${l.bound_ip || 'None'}</span></td>
      <td>${l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Lifetime'}</td>
      ${!compact ? `
      <td>
        <div class="action-btns">
          <button class="tbl-btn tbl-btn-copy" onclick="copyText('${l.key}')">Copy</button>
          <button class="tbl-btn tbl-btn-info" onclick="doReset('${l.key}')">Reset IP</button>
          <button class="tbl-btn tbl-btn-danger" onclick="doRevoke('${l.key}')">Revoke</button>
        </div>
      </td>` : ''}
    </tr>
  `).join('');
  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Key</th><th>Product</th><th>Status</th><th>Bound IP</th><th>Expires</th>
        ${!compact ? '<th>Actions</th>' : ''}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── Generate ── */
document.getElementById('generateBtn').addEventListener('click', async () => {
  const product = document.getElementById('gen-product').value.trim();
  const days    = document.getElementById('gen-days').value.trim();
  const user_id = document.getElementById('gen-userid').value.trim();
  const resets  = document.getElementById('gen-resets').value;
  const el = document.getElementById('generateResult');

  if (!product || !days) { showToast('⚠️ Fill in product and duration'); return; }

  try {
    const data = await apiFetch('/api/licenses/generate', {
      method: 'POST',
      body: JSON.stringify({ product_name: product, days, user_id: user_id || null, max_resets: resets })
    });
    if (data.success) {
      el.innerHTML = `<div class="gen-result-card ok">✓ License Generated!<br><br>Key: <strong>${data.key}</strong><br>Expires: ${data.expiresAt || 'Lifetime'}<br>Max Resets: ${data.max_resets}</div>`;
      showToast('✨ License generated!');
    } else {
      el.innerHTML = `<div class="gen-result-card err">✗ ${data.message}</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="gen-result-card err">✗ ${e.message}</div>`;
  }
});

/* ── Revoke ── */
window.doRevoke = async function(key) {
  key = key || document.getElementById('revoke-key').value.trim();
  if (!key) { showToast('⚠️ Enter a license key'); return; }
  if (!confirm(`Revoke license: ${key}?`)) return;
  const el = document.getElementById('revokeResult');
  try {
    const data = await apiFetch('/api/licenses/revoke', {
      method: 'POST', body: JSON.stringify({ license_key: key })
    });
    if (data.success) {
      if (el) el.innerHTML = `<div class="gen-result-card ok">✓ ${data.message}</div>`;
      showToast('🚫 License revoked');
      loadLicenses();
    } else {
      if (el) el.innerHTML = `<div class="gen-result-card err">✗ ${data.message}</div>`;
    }
  } catch (e) {
    if (el) el.innerHTML = `<div class="gen-result-card err">✗ ${e.message}</div>`;
  }
};
document.getElementById('revokeBtn').addEventListener('click', () => doRevoke());

/* ── Reset IP ── */
window.doReset = async function(key) {
  key = key || document.getElementById('reset-key').value.trim();
  if (!key) { showToast('⚠️ Enter a license key'); return; }
  const el = document.getElementById('resetResult');
  try {
    const data = await apiFetch('/api/licenses/reset', {
      method: 'POST', body: JSON.stringify({ license_key: key })
    });
    if (data.success) {
      if (el) el.innerHTML = `<div class="gen-result-card ok">✓ ${data.message}</div>`;
      showToast('🔄 IP reset successful');
      loadLicenses();
    } else {
      if (el) el.innerHTML = `<div class="gen-result-card err">✗ ${data.message}</div>`;
    }
  } catch (e) {
    if (el) el.innerHTML = `<div class="gen-result-card err">✗ ${e.message}</div>`;
  }
};
document.getElementById('resetBtn').addEventListener('click', () => doReset());

/* ── Logs ── */
window.loadLogs = async function() {
  const el = document.getElementById('logsTable');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const data = await apiFetch('/api/licenses/logs');
    if (data && data.logs) {
      const search = document.getElementById('logSearchInput').value.toLowerCase();
      const filtered = search
        ? data.logs.filter(l =>
            (l.license_key||'').toLowerCase().includes(search) ||
            (l.action||'').toLowerCase().includes(search) ||
            (l.ip||'').toLowerCase().includes(search) ||
            (l.result||'').toLowerCase().includes(search))
        : data.logs;
      renderLogsTable(filtered.reverse());
    } else {
      el.innerHTML = `<div class="empty-state">No logs endpoint found at /api/logs.</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
};
document.getElementById('logSearchInput').addEventListener('input', loadLogs);

function renderLogsTable(logs) {
  const el = document.getElementById('logsTable');
  if (!logs || logs.length === 0) { el.innerHTML = '<div class="empty-state">No logs found.</div>'; return; }
  const rows = logs.map(l => `
    <tr>
      <td><span class="mono">${l.license_key || '—'}</span></td>
      <td>${l.action || '—'}</td>
      <td><span class="badge badge-${l.result}">${l.result}</span></td>
      <td><span class="mono">${l.ip || '—'}</span></td>
      <td>${l.message || '—'}</td>
      <td style="color:var(--text3);font-size:0.78rem;">${l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
    </tr>
  `).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>License Key</th><th>Action</th><th>Result</th><th>IP</th><th>Message</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ── API Keys ── */
window.loadApiKeys = async function() {
  const el = document.getElementById('apiKeysTable');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const data = await apiFetch('/api/keys/list');
    if (data && data.keys) {
      renderApiKeysTable(data.keys);
    } else {
      el.innerHTML = `<div class="empty-state">No API keys found or /api/keys not available.</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
};

function renderApiKeysTable(keys) {
  const el = document.getElementById('apiKeysTable');
  if (!keys || keys.length === 0) { el.innerHTML = '<div class="empty-state">No API keys found.</div>'; return; }
  const rows = keys.map(k => `
    <tr>
      <td>${k.label || '—'}</td>
      <td><span class="mono">${k.key ? k.key.substring(0,20) + '…' : '—'}</span></td>
      <td><span class="badge badge-active">${k.role || 'admin'}</span></td>
      <td style="color:var(--text3);font-size:0.78rem;">${k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}</td>
      <td>
        <button class="tbl-btn tbl-btn-copy" onclick="copyText('${k.key}')">Copy</button>
      </td>
    </tr>
  `).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Label</th><th>Key</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('createApiKeyBtn').addEventListener('click', async () => {
  const label = document.getElementById('ak-label').value.trim();
  const role  = document.getElementById('ak-role').value;
  const el = document.getElementById('akResult');
  if (!label) { showToast('⚠️ Enter a label'); return; }
  try {
    const data = await apiFetch('/api/keys/create', {
      method: 'POST', body: JSON.stringify({ label, role })
    });
    if (data.success || data.key) {
      el.innerHTML = `<div class="gen-result-card ok">✓ API Key Created!<br><br>Key: <strong>${data.key}</strong></div>`;
      showToast('🔐 API Key created!');
      loadApiKeys();
    } else {
      el.innerHTML = `<div class="gen-result-card err">✗ ${data.message || 'Failed'}</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="gen-result-card err">✗ ${e.message}</div>`;
  }
});

/* ── Products ── */
window.loadProducts = async function() {
  const el = document.getElementById('productsTable');
  el.innerHTML = '<div class="empty-state">Loading...</div>';
  try {
    const data = await apiFetch('/api/products/all');
    if (data && data.products) {
      renderProductsTable(data.products);
    } else {
      el.innerHTML = `<div class="empty-state">No products found.</div>`;
    }
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
};

function renderProductsTable(products) {
  const el = document.getElementById('productsTable');
  if (!products || products.length === 0) { el.innerHTML = '<div class="empty-state">No products found.</div>'; return; }
  const rows = products.map(p => {
    // Escape product object for onclick handler
    const pStr = JSON.stringify(p).replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `
    <tr>
      <td>${p.emoji} <strong>${p.name}</strong></td>
      <td><span class="badge badge-active">${p.type}</span></td>
      <td>${p.version}</td>
      <td>${p.mc_version}</td>
      <td>
        <div class="action-btns">
          <button class="tbl-btn tbl-btn-info" onclick="editProduct('${pStr}')">Edit</button>
          <button class="tbl-btn tbl-btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      </td>
    </tr>
  `}).join('');
  el.innerHTML = `
    <table>
      <thead><tr><th>Product</th><th>Type</th><th>Version</th><th>MC</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

document.getElementById('saveProductBtn').addEventListener('click', async () => {
  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value.trim();
  const emoji = document.getElementById('prod-emoji').value.trim();
  const type = document.getElementById('prod-type').value;
  const version = document.getElementById('prod-version').value.trim();
  const mc = document.getElementById('prod-mc').value.trim();
  const link = document.getElementById('prod-link').value.trim();
  const desc = document.getElementById('prod-desc').value.trim();
  const features = document.getElementById('prod-features').value.trim();

  if (!name) { showToast('⚠️ Enter product name'); return; }

  const endpoint = id ? '/api/products/update' : '/api/products/create';
  const body = { id, name, emoji, type, version, mc_version: mc, buy_link: link, description: desc, features };

  try {
    const data = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
    if (data.success) {
      showToast(id ? '✅ Product updated' : '✨ Product created');
      resetProductForm();
      loadProducts();
    } else {
      showToast('✗ ' + data.message);
    }
  } catch (e) {
    showToast('✗ ' + e.message);
  }
});

window.editProduct = function(pJson) {
  const p = JSON.parse(pJson.replace(/&quot;/g, '"'));
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-emoji').value = p.emoji;
  document.getElementById('prod-type').value = p.type;
  document.getElementById('prod-version').value = p.version;
  document.getElementById('prod-mc').value = p.mc_version;
  document.getElementById('prod-link').value = p.buy_link || '';
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-features').value = p.features || '';
  
  document.getElementById('prod-form-title').textContent = 'Edit Product';
  document.getElementById('saveProductBtn').textContent = 'Update Product';
  document.getElementById('cancelProdBtn').classList.remove('hidden');
  document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('cancelProdBtn').addEventListener('click', resetProductForm);

function resetProductForm() {
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-emoji').value = '';
  document.getElementById('prod-type').value = 'plugin';
  document.getElementById('prod-version').value = '';
  document.getElementById('prod-mc').value = '';
  document.getElementById('prod-link').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-features').value = '';
  
  document.getElementById('prod-form-title').textContent = 'Add New Product';
  document.getElementById('saveProductBtn').textContent = 'Save Product';
  document.getElementById('cancelProdBtn').classList.add('hidden');
}

window.deleteProduct = async function(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    const data = await apiFetch('/api/products/delete', { method: 'POST', body: JSON.stringify({ id }) });
    if (data.success) {
      showToast('🗑️ Product deleted');
      loadProducts();
    }
  } catch (e) {
    showToast('✗ ' + e.message);
  }
};
