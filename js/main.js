// Desact Studios — Main Logic
const API_BASE = window.DESACT_CONFIG ? window.DESACT_CONFIG.API_URL : 'https://backend-server-ajoc.onrender.com';

// ── Product Loading ──
async function loadPublicProducts() {
    const grid = document.getElementById('productGrid');
    try {
        const res = await fetch(`${API_BASE}/api/products/public`);
        const data = await res.json();
        
        if (data.success && data.products.length > 0) {
            grid.innerHTML = data.products.map(p => `
                <div class="product-card">
                    <div class="prod-header">
                        <div class="prod-emoji">${p.emoji || '📦'}</div>
                        <span class="prod-badge">${p.type || 'Plugin'}</span>
                    </div>
                    <h3 class="prod-name">${p.name}</h3>
                    <p class="prod-desc">${p.description || 'Professional Minecraft resource.'}</p>
                    <div class="prod-features">
                        ${(p.features || '').split(',').map(f => f.trim()).filter(f => f).map(f => `
                            <span class="feature-tag">${f}</span>
                        `).join('')}
                    </div>
                    <div class="prod-footer">
                        <span class="prod-version">v${p.version || '1.0'} • ${p.mc_version || '1.20+'}</span>
                        <a href="${p.buy_link || '#'}" class="btn btn-glass" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                            ${p.buy_link ? 'Get Now' : 'Contact'}
                        </a>
                    </div>
                </div>
            `).join('');
        } else {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-dark);">No products available yet.</p>';
        }
    } catch (err) {
        console.error('Failed to load products:', err);
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #ef4444;">Failed to load products. Make sure the backend is running.</p>';
    }
}

// ── License Checking ──
const checkBtn = document.getElementById('checkBtn');
const licenseInput = document.getElementById('licenseInput');
const resultDiv = document.getElementById('checkResult');

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
            resultDiv.style.background = 'rgba(34, 197, 94, 0.1)';
            resultDiv.style.border = '1px solid rgba(34, 197, 94, 0.2)';
            resultDiv.style.color = '#4ade80';
            resultDiv.innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">✅ Valid License</div>
                <div style="font-size: 0.9rem; color: var(--text-dim)">
                    Product: <strong>${data.license.product_name}</strong><br>
                    Status: <span style="text-transform: uppercase; font-weight: bold;">${data.license.status}</span><br>
                    Expires: ${data.license.expires_at ? new Date(data.license.expires_at).toLocaleDateString() : 'Never'}
                </div>
            `;
        } else {
            resultDiv.style.background = 'rgba(239, 68, 68, 0.1)';
            resultDiv.style.border = '1px solid rgba(239, 68, 68, 0.2)';
            resultDiv.style.color = '#f87171';
            resultDiv.innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">✗ Invalid License</div>
                <div style="font-size: 0.9rem;">${data.message}</div>
            `;
        }
    } catch (err) {
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        resultDiv.style.color = '#f87171';
        resultDiv.textContent = 'Connection error. Is the backend online?';
    } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'Verify Key';
    }
});

// ── Discord Link Sync ──
async function loadDiscordLink() {
    try {
        const res = await fetch(`${API_BASE}/api/settings/discord_link`);
        const data = await res.json();
        if (data.success && data.value) {
            const link = data.value;
            // Update all Discord links
            document.querySelectorAll('a[href*="discord.gg"]').forEach(a => a.href = link);
            const mainBtn = document.getElementById('discordLink');
            if (mainBtn) mainBtn.href = link;
        }
    } catch (err) {
        console.error('Failed to load discord link:', err);
    }
}

// Initial load
loadPublicProducts();
loadDiscordLink();

// ── Chat Widget Logic ──
const chatTrigger = document.getElementById('chatTrigger');
const chatWindow = document.getElementById('chatWindow');
const chatClose = document.getElementById('chatClose');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatMessages = document.getElementById('chatMessages');

chatTrigger.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
});

chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

function addMessage(text, side) {
    const msg = document.createElement('div');
    msg.className = `msg ${side}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    // Mock AI Response (Can be replaced with actual API call)
    setTimeout(() => {
        const responses = [
            "I'm here to help! You can check your license in the 'Checker' section or join our Discord for manual support.",
            "Desact Studios plugins are optimized for 1.20+. Which plugin are you interested in?",
            "If you're having IP reset issues, make sure you haven't exceeded your 3-reset limit.",
            "Our Discord support team is online! Check the link at the bottom of this chat."
        ];
        const random = responses[Math.floor(Math.random() * responses.length)];
        addMessage(random, 'bot');
    }, 800);
}

sendChatBtn.addEventListener('click', handleChat);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});

function sendQuickMsg(text) {
    chatInput.value = text;
    handleChat();
}
