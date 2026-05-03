/**
 * ShareT Chrome Extension — Content Script
 * Injects a "Share via ShareT" button into Trello card detail views
 */

(function() {
  'use strict';

  // Get ShareT server URL from extension storage.
  // No hardcoded fallback — admin must configure via the extension popup.
  function getShareTUrl() {
    return new Promise((resolve) => {
      if (chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['sharetUrl'], (result) => {
          resolve(result.sharetUrl || '');
        });
      } else {
        resolve('');
      }
    });
  }

  // Extract card data from the current Trello card detail view
  function getCardData() {
    const cardTitle = document.querySelector('.card-detail-title-assist')?.textContent?.trim() 
      || document.querySelector('[data-testid="card-back-name"]')?.textContent?.trim()
      || '';
    
    const boardTitle = document.querySelector('[data-testid="board-name-display"]')?.textContent?.trim()
      || document.querySelector('.board-header-btn-text')?.textContent?.trim()
      || '';
    
    // Extract card ID from URL
    const urlMatch = window.location.pathname.match(/\/c\/([a-zA-Z0-9]+)/);
    const cardShortId = urlMatch ? urlMatch[1] : '';
    
    return { cardTitle, boardTitle, cardShortId };
  }

  // Create and inject the ShareT button
  function injectShareButton() {
    // Check if button already exists
    if (document.getElementById('sharet-share-btn')) return;
    
    // Find the card sidebar (where Trello's action buttons are)
    const sidebar = document.querySelector('.card-detail-item-add-button')?.closest('.window-sidebar')
      || document.querySelector('.js-plugin-buttons')
      || document.querySelector('[data-testid="card-back-sidebar"]');
    
    if (!sidebar) return;
    
    // Create the ShareT button section
    const section = document.createElement('div');
    section.id = 'sharet-share-section';
    section.className = 'window-module u-clearfix';
    section.innerHTML = `
      <h3 class="mod-no-top-margin" style="padding: 0 12px; font-size: 12px; font-weight: 600; color: #5e6c84; text-transform: uppercase; margin-bottom: 4px;">
        ShareT
      </h3>
      <div style="padding: 0 12px;">
        <button id="sharet-share-btn" style="
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 6px 12px;
          background: #0079bf;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share via ShareT
        </button>
      </div>
    `;
    
    // Insert at the beginning of sidebar
    sidebar.insertBefore(section, sidebar.firstChild);
    
    // Add click handler
    document.getElementById('sharet-share-btn').addEventListener('click', async () => {
      const card = getCardData();
      const sharetUrl = await getShareTUrl();

      if (!sharetUrl) {
        alert('ShareT server URL is not configured.\n\nClick the ShareT extension icon in your toolbar and enter your ShareT server URL (e.g. your Cloudflare tunnel URL).');
        return;
      }

      const params = new URLSearchParams({
        cardId: card.cardShortId,
        cardName: card.cardTitle,
        boardName: card.boardTitle,
        source: 'extension'
      });

      window.open(`${sharetUrl.replace(/\/$/, '')}/app?${params.toString()}`, '_blank');
    });
    
    // Hover effect
    const btn = document.getElementById('sharet-share-btn');
    btn.addEventListener('mouseenter', () => { btn.style.background = '#026aa7'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = '#0079bf'; });
  }

  // Watch for card detail views opening (Trello is a SPA)
  const observer = new MutationObserver(() => {
    // Check if we're on a card detail view
    if (window.location.pathname.includes('/c/')) {
      setTimeout(injectShareButton, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Initial check
  if (window.location.pathname.includes('/c/')) {
    setTimeout(injectShareButton, 1000);
  }
})();
