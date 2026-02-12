// ===== BOTPRESS CHATBOT (EMBEDDED IFRAME) =====

export function initChatbot() {
    const toggleBtn = document.getElementById('chatbotToggle');
    const container = document.getElementById('chatbotContainer');
    const closeBtn = document.getElementById('closeChatbotBtn');
    const badge = document.getElementById('chatbotBadge');
    
    if (!toggleBtn || !container) return;
    
    // Load iframe only when needed (lazy load)
    let iframe = document.getElementById('botpressIframe');
    
    toggleBtn.addEventListener('click', () => {
        container.classList.toggle('open');
        
        // If iframe hasn't loaded src yet, set it
        if (!iframe.src || iframe.src === 'about:blank') {
            iframe.src = "https://cdn.botpress.cloud/webchat/v3.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/09/19/12/20250919120812-U02J9S5K.json";
        }
        
        // Hide badge when opened
        if (badge) badge.style.display = 'none';
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            container.classList.remove('open');
        });
    }
    
    // Simulate unread message (optional)
    setInterval(() => {
        if (badge && !container.classList.contains('open')) {
            // Only show if there's a new message (random)
            if (Math.random() > 0.7) {
                badge.textContent = '1';
                badge.style.display = 'flex';
            }
        }
    }, 60000); // every minute
}
