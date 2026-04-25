// ============================================================
// DESACT STUDIOS — Main JS (Three.js bg + interactivity)
// ============================================================

const API_BASE = (window.DESACT_CONFIG && window.DESACT_CONFIG.API_BASE) || 'http://localhost:3000';

/* ── Three.js Particle Background ── */
(function initThree() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Particles
  const count = 1800;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const purpleRGB = [0.49, 0.23, 0.93];
  const cyanRGB   = [0.02, 0.71, 0.83];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    const t = Math.random();
    colors[i * 3]     = purpleRGB[0] * (1 - t) + cyanRGB[0] * t;
    colors[i * 3 + 1] = purpleRGB[1] * (1 - t) + cyanRGB[1] * t;
    colors[i * 3 + 2] = purpleRGB[2] * (1 - t) + cyanRGB[2] * t;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.7 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Mouse parallax
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 0.4;
    my = (e.clientY / window.innerHeight - 0.5) * 0.4;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let clock = 0;
  function animate() {
    requestAnimationFrame(animate);
    clock += 0.0004;
    points.rotation.y = clock + mx;
    points.rotation.x = clock * 0.5 + my;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveLink();
});

/* ── Mobile menu ── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── Active nav link ── */
function updateActiveLink() {
  const sections = ['home', 'products', 'checker', 'about'];
  const scrollY = window.scrollY + 100;
  sections.forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (!link) return;
    if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
}

/* ── Stat counter animation ── */
function animateCount(el) {
  const target = parseInt(el.dataset.count);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 50));
  const id = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + (el.dataset.count == '99' ? '%' : '+');
    if (current >= target) clearInterval(id);
  }, 30);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('.stat-value').forEach(animateCount);
      observer.disconnect();
    }
  });
}, { threshold: 0.4 });
const statsEl = document.querySelector('.hero-stats');
if (statsEl) observer.observe(statsEl);

/* ── Products Data (Dynamic) ── */
let PRODUCTS = [];
const grid = document.getElementById('productsGrid');

async function loadPublicProducts() {
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><span class="spinner"></span><br><br>Loading products...</div>';
  try {
    const res = await fetch(`${API_BASE}/api/products/public`);
    const data = await res.json();
    if (data.success && data.products) {
      PRODUCTS = data.products;
      renderProducts();
    } else {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text3);">No products available at the moment.</div>';
    }
  } catch (err) {
    console.error('Failed to load products:', err);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #ef4444;">Failed to load products. Make sure the backend is running.</div>';
  }
}

function renderProducts(filter = 'all') {
  grid.innerHTML = '';
  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.type === filter);
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text3);">No products found in this category.</div>';
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-type', p.type);
    
    // Convert features string to array if needed
    const features = typeof p.features === 'string' ? p.features.split(',').filter(f => f.trim()) : (p.features || []);
    
    card.innerHTML = `
      <div class="product-card-banner" style="background: linear-gradient(135deg, var(--purple)18, var(--purple)08);">
        <div class="product-card-emoji">${p.emoji || '📦'}</div>
      </div>
      <div class="product-card-body">
        <span class="product-card-badge badge-${p.type}">${p.type}</span>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description ? (p.description.substring(0, 80) + (p.description.length > 80 ? '...' : '')) : ''}</div>
        <div class="product-card-footer">
          <div class="product-card-price">
            <span style="color: var(--text3); font-size: 0.9rem;">Contact for Price</span>
          </div>
          <button class="product-card-btn" onclick="openProduct(${p.id})">View Details</button>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openProduct(p.id));
    grid.appendChild(card);
  });
}

// Initial load
loadPublicProducts();
loadDiscordLink();

async function loadDiscordLink() {
  try {
    const res = await fetch(`${API_BASE}/api/settings/discord_link`);
    const data = await res.json();
    if (data.success && data.value) {
      if (window.DESACT_CONFIG) window.DESACT_CONFIG.DISCORD_INVITE = data.value;
      // Update any direct links if they exist
      document.querySelectorAll('a[href*="discord.gg"]').forEach(a => a.href = data.value);
    }
  } catch (err) {
    console.error('Failed to load discord link:', err);
  }
}

/* ── Filter tabs ── */
document.getElementById('filterTabs').addEventListener('click', e => {
  if (!e.target.classList.contains('filter-tab')) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  renderProducts(e.target.dataset.filter);
});

/* ── Product Modal ── */
window.openProduct = function(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById('modalContent');
  
  // Parse features
  const features = typeof p.features === 'string' ? p.features.split(',').filter(f => f.trim()) : (p.features || []);
  const buyLink = p.buy_link || (window.DESACT_CONFIG && window.DESACT_CONFIG.DISCORD_INVITE) || '#';

  modal.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
      <div style="font-size:3rem;">${p.emoji || '📦'}</div>
      <div>
        <div style="font-size:1.5rem;font-weight:800;">${p.name}</div>
        <span class="product-card-badge badge-${p.type}">${p.type}</span>
      </div>
    </div>
    <p style="color:var(--text2);line-height:1.7;margin-bottom:1.5rem;">${p.description || 'No description available.'}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.5rem;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:0.75rem;">
        <div style="font-size:0.75rem;color:var(--text3);margin-bottom:2px;">Version</div>
        <div style="font-weight:700;">${p.version || '1.0'}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:0.75rem;">
        <div style="font-size:0.75rem;color:var(--text3);margin-bottom:2px;">Minecraft</div>
        <div style="font-weight:700;">${p.mc_version || '1.20+'}</div>
      </div>
    </div>
    ${features.length > 0 ? `
    <div style="margin-bottom:1.5rem;">
      <div style="font-weight:700;margin-bottom:0.75rem;">Features</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        ${features.map(f => `<span style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);color:var(--purple-light);padding:4px 12px;border-radius:6px;font-size:0.8rem;">${f.trim()}</span>`).join('')}
      </div>
    </div>` : ''}
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:1rem;border-top:1px solid var(--border);">
      <div style="font-size:1.2rem;font-weight:800;color:var(--text3);">Buy on Discord</div>
      <a href="${buyLink}" target="_blank" class="btn btn-primary" style="text-decoration: none;">Contact to Buy</a>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
};

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('open');
});
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('open');
});

/* ── License Checker ── */

document.getElementById('checkBtn').addEventListener('click', checkLicense);
document.getElementById('licenseInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkLicense();
});

async function checkLicense() {
  const key = document.getElementById('licenseInput').value.trim().toUpperCase();
  const result = document.getElementById('checkerResult');
  if (!key) { showToast('⚠️ Please enter a license key'); return; }

  // Update input with uppercased value
  document.getElementById('licenseInput').value = key;

  result.innerHTML = `<div class="result-card loading"><div class="result-status"><span class="spinner"></span> Checking your license...</div></div>`;

  try {
    // Use the public endpoint — no API key needed
    const res = await fetch(`${API_BASE}/api/public/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key })
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();

    if (data.valid && data.license) {
      const l = data.license;
      const expiry = l.expires_at ? new Date(l.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '∞ Lifetime';
      result.innerHTML = `
        <div class="result-card valid">
          <div class="result-status ok">✓ License Active</div>
          <div class="result-row"><span class="result-row-label">Key</span><span class="result-row-val">${l.key}</span></div>
          <div class="result-row"><span class="result-row-label">Product</span><span class="result-row-val">${l.product_name || 'N/A'}</span></div>
          <div class="result-row"><span class="result-row-label">Status</span><span class="result-row-val" style="color:var(--green)">● Active</span></div>
          <div class="result-row"><span class="result-row-label">Bound IP</span><span class="result-row-val">${l.bound_ip || 'Not bound yet'}</span></div>
          <div class="result-row"><span class="result-row-label">Expires</span><span class="result-row-val">${expiry}</span></div>
        </div>`;
    } else {
      const statusColor = data.status === 'revoked' ? '#ef4444' : data.status === 'expired' ? 'var(--amber)' : '#ef4444';
      result.innerHTML = `
        <div class="result-card invalid">
          <div class="result-status err">✗ ${data.message || 'Invalid License'}</div>
          <div class="result-row"><span class="result-row-label">Key</span><span class="result-row-val">${key}</span></div>
          ${data.status ? `<div class="result-row"><span class="result-row-label">Status</span><span class="result-row-val" style="color:${statusColor}">${data.status}</span></div>` : ''}
          <div class="result-row"><span class="result-row-label">Help</span><span class="result-row-val">Contact us on Discord</span></div>
        </div>`;
    }
  } catch (err) {
    result.innerHTML = `
      <div class="result-card invalid">
        <div class="result-status err">✗ Could not reach backend</div>
        <div class="result-row"><span class="result-row-label">Reason</span><span class="result-row-val">${err.message}</span></div>
        <div class="result-row"><span class="result-row-label">Fix</span><span class="result-row-val">Update API_BASE in js/config.js</span></div>
      </div>`;
  }
}

function buildSimpleResult(key, valid, message) {
  return `<div class="result-card ${valid ? 'valid' : 'invalid'}">
    <div class="result-status ${valid ? 'ok' : 'err'}">${valid ? '✓ Valid License' : '✗ Invalid License'}</div>
    <div class="result-row"><span class="result-row-label">Key</span><span class="result-row-val">${key}</span></div>
    <div class="result-row"><span class="result-row-label">Message</span><span class="result-row-val">${message}</span></div>
  </div>`;
}

/* ── Toast ── */
window.showToast = function(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
};
