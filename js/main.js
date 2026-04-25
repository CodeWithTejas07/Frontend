// Desact Studios — Main Logic
const API_BASE = window.DESACT_CONFIG ? window.DESACT_CONFIG.API_BASE : 'https://backend-server-ajoc.onrender.com';

// ── Product Loading ──
async function loadPublicProducts() {
    const grid = document.getElementById('productGrid');
    try {
        const res = await fetch(`${API_BASE}/api/products/public`);
        const data = await res.json();
        
        if (data.success && data.products.length > 0) {
            grid.innerHTML = data.products.map(p => `
                <div class="product-card">
                    <div class="prod-emoji">${p.emoji || '📦'}</div>
                    <h3 class="prod-name">${p.name}</h3>
                    <p class="prod-desc">${p.description || 'Professional Minecraft resource.'}</p>
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap;">
                        ${(p.features || '').split(',').map(f => f.trim()).filter(f => f).map(f => `
                            <span style="font-size: 0.75rem; padding: 0.2rem 0.5rem; background: var(--gray-800); border: 1px solid var(--border); border-radius: 4px;">${f}</span>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                        <span style="font-size: 0.8rem; color: var(--gray-400);">v${p.version || '1.0'}</span>
                        <a href="${p.buy_link || '#'}" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Get Build</a>
                    </div>
                </div>
            `).join('');
            
            // Re-apply 3D Tilt to new cards
            initTilt();
        } else {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--gray-400);">No products available yet.</p>';
        }
    } catch (err) {
        console.error('Failed to load products:', err);
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #ef4444;">Failed to load builds. Sync error.</p>';
    }
}

// ── 3D Tilt Logic ──
function initTilt() {
    const cards = document.querySelectorAll('.product-card, .tier-card, .tech-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// ── License Checking ──
const checkBtn = document.getElementById('checkBtn');
const licenseInput = document.getElementById('licenseInput');
const resultDiv = document.getElementById('checkResult');

if (checkBtn) {
    checkBtn.addEventListener('click', async () => {
        const key = licenseInput.value.trim();
        if (!key) return;

        checkBtn.disabled = true;
        checkBtn.innerHTML = 'Verifying...';
        resultDiv.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/api/public/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key })
            });
            const data = await res.json();

            resultDiv.style.display = 'block';
            if (data.valid) {
                resultDiv.style.background = 'rgba(34, 197, 94, 0.05)';
                resultDiv.style.border = '1px solid rgba(34, 197, 94, 0.2)';
                resultDiv.style.color = '#4ade80';
                resultDiv.innerHTML = `<div style="font-weight:700">✓ Valid: ${data.license.product_name}</div><div style="font-size:0.8rem">Status: Active</div>`;
            } else {
                resultDiv.style.background = 'rgba(239, 68, 68, 0.05)';
                resultDiv.style.border = '1px solid rgba(239, 68, 68, 0.2)';
                resultDiv.style.color = '#f87171';
                resultDiv.innerHTML = `<div>✗ ${data.message}</div>`;
            }
        } catch (err) {
            resultDiv.style.display = 'block';
            resultDiv.textContent = 'Verification server unreachable.';
        } finally {
            checkBtn.disabled = false;
            checkBtn.innerHTML = 'Verify Key';
        }
    });
}

// ── Chat Widget Logic ──
const chatTrigger = document.getElementById('chatTrigger');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

if (chatTrigger) {
    chatTrigger.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
    chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleChat();
        }
    });
}

function addMessage(text, side) {
    const msg = document.createElement('div');
    msg.style.background = side === 'user' ? 'var(--primary)' : 'var(--gray-800)';
    msg.style.padding = '0.75rem';
    msg.style.borderRadius = '8px';
    msg.style.fontSize = '0.875rem';
    msg.style.marginBottom = '1rem';
    msg.style.alignSelf = side === 'user' ? 'flex-end' : 'flex-start';
    msg.style.maxWidth = '85%';
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    setTimeout(() => {
        addMessage("Processing infrastructure query... For direct support, please join our Discord.", 'bot');
    }, 600);
}

function sendQuickMsg(text) {
    chatInput.value = text;
    handleChat();
}

// Initial load
loadPublicProducts();
initTilt();
