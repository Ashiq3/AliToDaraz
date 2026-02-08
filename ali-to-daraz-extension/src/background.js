import { parseDarazJson } from './utils/parser.js';

console.log("AliToDaraz Background Script Running v3.1 - Visual Search Mode");

// Setup Context Menu
chrome.runtime.onInstalled.addListener(() => {
    console.log("AliToDaraz Installed - Visual Search Edition");
    chrome.contextMenus.create({
        id: "aliToDarazCompare",
        title: "Compare '%s' on Daraz",
        contexts: ["selection"]
    });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "aliToDarazCompare") {
        chrome.tabs.sendMessage(tab.id, {
            action: "CONTEXT_SEARCH_TRIGGER",
            text: info.selectionText
        });
    }
});

// Handle Messages from Content Script / Sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Visual Search using Google Lens
    if (request.action === "VISUAL_SEARCH") {
        console.log("[BG] VISUAL_SEARCH received, image:", request.imageUrl?.substring(0, 100));

        performVisualSearch(request.imageUrl)
            .then(results => {
                console.log("[BG] Visual search found", results.length, "Daraz results");
                if (results.length > 0) {
                    sendResponse({ status: "success", results });
                } else {
                    sendResponse({ status: "empty", results: [], fallbackSuggested: true });
                }
            })
            .catch(err => {
                console.error("[BG] Visual search error:", err);
                sendResponse({ status: "error", message: err.message });
            });

        return true;
    }

    // Keyword search fallback
    if (request.action === "SEARCH_DARAZ") {
        console.log("[BG] SEARCH_DARAZ received, query:", request.query);

        const query = encodeURIComponent(request.query);
        const searchUrl = `https://www.daraz.com.bd/catalog/?ajax=true&isFirstRequest=true&page=1&q=${query}`;

        fetch(searchUrl)
            .then(response => response.json())
            .then(json => {
                const results = parseDarazJson(json);
                console.log(`[BG] Found ${results.length} results for: ${request.query}`);
                if (results.length > 0) {
                    sendResponse({ status: "success", results });
                } else {
                    sendResponse({ status: "empty", results: [] });
                }
            })
            .catch(err => {
                console.error(`[BG] Fetch error for "${request.query}":`, err);
                sendResponse({ status: "error", message: err.message || "Failed to fetch from Daraz" });
            });

        return true;
    }
});

/**
 * Perform visual search using Google Lens
 */
async function performVisualSearch(imageUrl) {
    return new Promise((resolve, reject) => {
        if (!imageUrl) {
            reject(new Error("No image URL provided"));
            return;
        }

        // Construct Google Lens URL
        const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`;
        console.log("[BG] Opening Lens URL in minimized window");

        // Create a MINIMIZED WINDOW - completely hidden from user's main browser
        chrome.windows.create({
            url: lensUrl,
            state: 'minimized',  // Window is minimized (hidden from view)
            focused: false,      // Don't steal focus
            type: 'popup'        // Smaller footprint
        }, (newWindow) => {
            const windowId = newWindow.id;
            const tabId = newWindow.tabs[0].id;
            console.log("[BG] Created minimized Lens window:", windowId, "tab:", tabId);

            let attempts = 0;
            const maxAttempts = 25; // 50 seconds max

            const cleanup = () => {
                // Close the entire window, not just the tab
                chrome.windows.remove(windowId).catch(() => { });
            };

            const checkAndExtract = () => {
                attempts++;
                console.log("[BG] Data extraction attempt", attempts);

                if (attempts > maxAttempts) {
                    console.log("[BG] Max attempts reached, closing window");
                    cleanup();
                    resolve([]);
                    return;
                }

                // First, scroll the page to trigger lazy loading
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        window.scrollTo(0, 500);
                        window.scrollTo(0, 1000);
                        window.scrollTo(0, 0);
                    }
                }).then(() => {
                    // Then extract data
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: extractLensResultsV2
                    }, (injectionResults) => {
                        if (chrome.runtime.lastError) {
                            console.log("[BG] Script injection error:", chrome.runtime.lastError.message);
                            setTimeout(checkAndExtract, 2000);
                            return;
                        }

                        const result = injectionResults?.[0]?.result;
                        console.log("[BG] Extraction result:", JSON.stringify(result));

                        if (result?.darazResults?.length > 0) {
                            console.log("[BG] Found Daraz results:", result.darazResults.length);
                            cleanup();
                            resolve(result.darazResults);
                        } else if (result?.pageReady && attempts > 12) {
                            // Page is ready but no Daraz results after 12 attempts (24 sec)
                            console.log("[BG] Page ready, no Daraz results found. Debug:", result.debug);
                            cleanup();
                            resolve([]);
                        } else {
                            // Keep trying
                            setTimeout(checkAndExtract, 2000);
                        }
                    });
                }).catch(err => {
                    console.log("[BG] Scroll error:", err);
                    setTimeout(checkAndExtract, 2000);
                });
            };

            // Start data extraction after initial load delay (give Lens time to process image)
            setTimeout(checkAndExtract, 5000);
        });
    });
}

/**
 * Data extraction function v2 - runs inside Google Lens page
 * More robust DOM traversal
 * This function collects publicly available product information from search results
 */
function extractLensResultsV2() {
    const results = {
        pageReady: false,
        allLinks: 0,
        darazResults: [],
        debug: []
    };

    try {
        // Check if page has loaded content
        const body = document.body;
        if (!body || body.innerText.length < 500) {
            results.debug.push("Page not ready yet");
            return results;
        }
        results.pageReady = true;

        // Method 1: Find all anchor tags and filter for Daraz
        const allAnchors = document.querySelectorAll('a');
        results.allLinks = allAnchors.length;
        results.debug.push(`Found ${allAnchors.length} total links`);

        allAnchors.forEach(anchor => {
            const href = anchor.href || '';

            // Check if link points to Daraz
            if (href.includes('daraz.com.bd') || href.includes('daraz.com')) {
                // Navigate up to find the product card - try different levels
                let container = anchor;
                let bestContainer = anchor;

                // Go up and find the most useful container (one with an image)
                for (let i = 0; i < 5; i++) {
                    if (container.parentElement) {
                        container = container.parentElement;
                        // Check if this container has an img
                        if (container.querySelector('img[src*="http"]')) {
                            bestContainer = container;
                        }
                    }
                }

                // Find ALL images in the container and pick the best one
                const allImages = bestContainer.querySelectorAll('img');
                let bestImage = '';
                for (const img of allImages) {
                    // Prefer actual URLs over data URIs
                    const src = img.src || img.dataset?.src || img.getAttribute('data-src') || '';
                    if (src.startsWith('http') && !src.includes('data:') && src.length > 20) {
                        bestImage = src;
                        break;
                    }
                    // Check srcset as fallback
                    const srcset = img.srcset || '';
                    if (srcset) {
                        const firstUrl = srcset.split(',')[0]?.split(' ')[0];
                        if (firstUrl && firstUrl.startsWith('http')) {
                            bestImage = firstUrl;
                            break;
                        }
                    }
                }

                // Get text from multiple sources
                const anchorText = anchor.innerText?.trim() || '';
                const containerText = bestContainer.innerText?.trim() || '';

                // Extract title - find the longest meaningful text line
                const allLines = containerText.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 5 && !l.match(/^(BDT|৳|Daraz\.com)/i));

                let bestTitle = allLines[0] || '';
                // If title is too generic, try to find a better one
                if (bestTitle.length < 10 || bestTitle.toLowerCase().includes('daraz')) {
                    for (const line of allLines) {
                        if (line.length > 10 && !line.toLowerCase().includes('daraz')) {
                            bestTitle = line;
                            break;
                        }
                    }
                }

                // Find price - search in container text
                let priceMatch = containerText.match(/(BDT|৳)\s*[\d,]+/i);
                // Also try looking for just numbers that look like prices
                if (!priceMatch) {
                    const numMatch = containerText.match(/(\d{2,6})/);
                    if (numMatch) {
                        priceMatch = ['BDT ' + numMatch[1]];
                    }
                }

                // Try to find rating  
                const ratingMatch = containerText.match(/(\d\.?\d?)\s*[★⭐]/);

                const productData = {
                    url: href,
                    title: bestTitle || 'Daraz Product',
                    image: bestImage,
                    price: priceMatch ? priceMatch[0] : '',
                    rating: ratingMatch ? ratingMatch[1] : '',
                    source: 'Visual Match'
                };

                // Avoid duplicates
                if (!results.darazResults.some(r => r.url === href)) {
                    results.darazResults.push(productData);
                    results.debug.push(`Found: ${bestTitle.substring(0, 30)}, img: ${bestImage ? 'YES' : 'NO'}, price: ${productData.price}`);
                }
            }
        });

        // Method 2: Look for text containing "daraz.com.bd"
        if (results.darazResults.length === 0) {
            const textNodes = document.evaluate(
                "//*[contains(text(), 'Daraz') or contains(text(), 'daraz.com.bd')]",
                document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
            );

            results.debug.push(`Found ${textNodes.snapshotLength} Daraz text mentions`);

            for (let i = 0; i < textNodes.snapshotLength; i++) {
                const node = textNodes.snapshotItem(i);
                const parentAnchor = node.closest('a');

                if (parentAnchor && parentAnchor.href) {
                    const href = parentAnchor.href;
                    if (!results.darazResults.some(r => r.url === href)) {
                        // Get parent container for more context
                        const container = parentAnchor.closest('[data-attrid], [data-ved], div') || parentAnchor.parentElement;
                        const img = container?.querySelector('img');
                        const text = container?.innerText || '';

                        results.darazResults.push({
                            url: href,
                            title: text.split('\n')[0] || 'Daraz Product',
                            image: img?.src || '',
                            price: '',
                            source: 'Visual Match'
                        });
                    }
                }
            }
        }

        // Method 3: Look for specific Google Lens product card structure
        const productCards = document.querySelectorAll('[data-item-id], [jsname], [data-hveid]');
        results.debug.push(`Found ${productCards.length} product cards`);

        productCards.forEach(card => {
            const cardText = card.innerText || '';
            const cardHtml = card.innerHTML || '';

            if (cardText.toLowerCase().includes('daraz') || cardHtml.includes('daraz.com.bd')) {
                const link = card.querySelector('a[href*="daraz"]') || card.closest('a[href*="daraz"]');
                if (link && !results.darazResults.some(r => r.url === link.href)) {
                    const img = card.querySelector('img');
                    results.darazResults.push({
                        url: link.href,
                        title: cardText.split('\n').filter(l => l.length > 5)[0] || 'Daraz Product',
                        image: img?.src || '',
                        price: '',
                        source: 'Visual Match'
                    });
                }
            }
        });

    } catch (e) {
        results.debug.push("Error: " + e.message);
    }

    return results;
}
