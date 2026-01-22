console.log("AliToDaraz Content Script Active");

// Create Floating Action Button
function createFAB() {
    // Prevent duplicate injection
    if (document.getElementById('ali-to-daraz-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'ali-to-daraz-fab';
    fab.innerText = 'Compare on Daraz';

    // Higher-end Styling
    Object.assign(fab.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647',
        padding: '14px 28px',
        background: 'linear-gradient(135deg, #F36F21, #FF9900)', // Daraz to Alibaba gradient
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px', // Modern slightly rounded
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(243, 111, 33, 0.3)',
        fontWeight: '600',
        fontSize: '14px',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backdropFilter: 'blur(8px)'
    });

    // Add icon
    fab.innerHTML = '<span>🔍</span> Compare on Daraz';

    fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.05)');
    fab.addEventListener('mouseleave', () => fab.style.transform = 'scale(1)');
    fab.addEventListener('click', toggleSidebar);

    document.body.appendChild(fab);
}

let sidebarIframe = null;

// Toggle Sidebar Iframe
function toggleSidebar() {
    if (sidebarIframe) {
        // If open, close it
        sidebarIframe.style.transform = 'translateX(100%)';
        setTimeout(() => {
            sidebarIframe.remove();
            sidebarIframe = null;
        }, 300); // Wait for animation
        return;
    }

    const iframe = document.createElement('iframe');
    // Chrome Extension URL for our sidebar
    iframe.src = chrome.runtime.getURL('src/sidebar/index.html');

    Object.assign(iframe.style, {
        position: 'fixed',
        top: '0',
        right: '0',
        width: '400px', // Slightly wider for better view
        height: '100vh',
        zIndex: '2147483647',
        border: 'none',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
        background: 'white',
        transform: 'translateX(100%)', // Start off-screen
        transition: 'transform 0.3s ease-out'
    });

    document.body.appendChild(iframe);

    // Force reflow
    iframe.getBoundingClientRect();

    // Slide in
    iframe.style.transform = 'translateX(0)';
    sidebarIframe = iframe;
}

// Listen for messages from Sidebar AND Background
window.addEventListener('message', (event) => {
    if (event.data.type === 'CLOSE_SIDEBAR') {
        toggleSidebar();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CONTEXT_SEARCH_TRIGGER') {
        // Save selected text as new product title (with empty image)
        const product = {
            title: request.text,
            image: '',
            url: window.location.href
        };
        chrome.storage.local.set({ 'aliProduct': product }, () => {
            // Force open sidebar if closed
            if (!sidebarIframe) {
                toggleSidebar();
            }
            // If already open, the storage change might need to signal reload, 
            // but Sidebar usually checks on mount. Use postMessage to be safer if it's already open.
            if (sidebarIframe && sidebarIframe.contentWindow) {
                sidebarIframe.contentWindow.postMessage({ type: 'REFRESH_DATA' }, '*');
            }
        });
    }
});

// Scrape Product Data
function scrapeProductData() {
    const product = {
        title: document.querySelector('meta[property="og:title"]')?.content || document.title,
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        url: window.location.href
    };

    // Clean title: Remove " - Alibaba.com" or similar suffixes if possible
    // Using a safe flexible regex
    product.title = product.title.replace(/ - Alibaba\.com/i, '').replace(/ - .*/, '').trim();

    // Save to storage
    chrome.storage.local.set({ 'aliProduct': product });
    // console.log('AliToDaraz Scraped:', product); // Keep logs minimal in prod
    return product;
}

// Init Logic
function init() {
    // Check if we are on a product page (simple heuristic: has 'buy' button or specific URL pattern)
    // For now, inject everywhere on Alibaba to test
    scrapeProductData();
    createFAB();
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
