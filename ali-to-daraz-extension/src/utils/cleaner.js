/**
 * Smart Title Cleaner - Extracts CORE PRODUCT TYPE from Alibaba's B2B titles
 * 
 * Problem: Alibaba uses SEO-stuffed B2B titles like:
 *   "Factory Outlet Hotel Home 100% Biodegradable Nice Packing Bamboo Toothbrush"
 * But Daraz uses consumer-friendly names like:
 *   "Bamboo Toothbrush"
 * 
 * Solution: Extract only the essential product keywords
 */

// Common product categories - these are the "anchor" words that define WHAT the product is
const PRODUCT_ANCHORS = [
    // Personal Care
    'toothbrush', 'razor', 'shaver', 'trimmer', 'brush', 'comb', 'mirror',
    // Electronics
    'earbuds', 'headphones', 'earphones', 'speaker', 'charger', 'cable', 'adapter',
    'powerbank', 'watch', 'smartwatch', 'phone', 'tablet', 'keyboard', 'mouse',
    // Fashion
    'shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'shoes', 'sneakers',
    'boots', 'sandals', 'bag', 'backpack', 'wallet', 'belt', 'sunglasses',
    // Home
    'lamp', 'light', 'fan', 'pillow', 'blanket', 'towel', 'mat', 'rug',
    'bottle', 'mug', 'cup', 'plate', 'bowl', 'container', 'organizer',
    // Beauty
    'lipstick', 'mascara', 'foundation', 'serum', 'cream', 'lotion', 'oil',
    // Tools
    'screwdriver', 'wrench', 'plier', 'drill', 'saw', 'hammer',
    // Sports
    'ball', 'racket', 'bat', 'gloves', 'helmet', 'bike', 'scooter'
];

// Material/Style modifiers worth keeping (these help narrow down the product)
const USEFUL_MODIFIERS = [
    'bamboo', 'wooden', 'wood', 'stainless', 'steel', 'leather', 'cotton',
    'wireless', 'bluetooth', 'electric', 'manual', 'automatic',
    'mini', 'portable', 'foldable', 'rechargeable',
    'men', 'women', 'kids', 'baby', 'adult'
];

// B2B junk words to ALWAYS remove
const JUNK_WORDS = [
    // B2B terms
    'factory', 'outlet', 'wholesale', 'oem', 'odm', 'custom', 'customized',
    'customizable', 'logo', 'branding', 'branded', 'manufacturer', 'supplier',
    'bulk', 'moq', 'sample', 'dropship', 'dropshipping',
    // Marketing fluff
    'hot', 'sale', 'selling', 'new', 'arrival', 'latest', 'popular', 'trending',
    'best', 'top', 'premium', 'luxury', 'high', 'quality', 'super', 'ultra',
    'professional', 'pro', 'advanced', 'innovative', 'original', 'genuine',
    // Descriptive fluff
    'nice', 'good', 'great', 'perfect', 'amazing', 'excellent', 'beautiful',
    'stylish', 'fashion', 'fashionable', 'elegant', 'modern', 'classic',
    // Location/Usage
    'hotel', 'home', 'office', 'travel', 'outdoor', 'indoor', 'kitchen',
    'bathroom', 'bedroom', 'living', 'room',
    // Eco buzzwords
    'eco', 'friendly', 'ecofriendly', 'biodegradable', 'organic', 'natural',
    'sustainable', 'green', 'environmental',
    // Numbers and specs (handled separately)
    'pcs', 'pieces', 'pack', 'set', 'lot', 'pairs', 'ml', 'cm', 'mm', 'inch',
    // Filler words
    'with', 'for', 'and', 'the', 'a', 'an', 'in', 'on', 'of', 'to', 'by'
];

/**
 * Extract the core product keywords from a B2B Alibaba title
 * @param {string} rawTitle - The original Alibaba product title
 * @returns {string} - Clean, searchable product name (2-4 words)
 */
export function cleanTitle(rawTitle) {
    if (!rawTitle) return '';

    // Step 1: Lowercase and remove special characters
    let text = rawTitle.toLowerCase()
        .replace(/[()[\]{}'"]/g, ' ')           // Remove brackets and quotes
        .replace(/[&+\-–—]/g, ' ')              // Remove connectors
        .replace(/\d+%?/g, ' ')                 // Remove numbers (100%, 2pcs, etc.)
        .replace(/[^\w\s]/g, ' ')               // Remove remaining punctuation
        .replace(/\s+/g, ' ')                   // Normalize spaces
        .trim();

    // Step 2: Split into words
    let words = text.split(' ').filter(w => w.length > 1);

    // Step 3: Remove junk words
    words = words.filter(word => !JUNK_WORDS.includes(word));

    // Step 4: Find the product anchor (the main product type)
    let anchor = null;
    let anchorIndex = -1;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Check if this word contains a product anchor
        for (const a of PRODUCT_ANCHORS) {
            if (word === a || word.includes(a) || a.includes(word)) {
                anchor = a;
                anchorIndex = i;
                break;
            }
        }
        if (anchor) break;
    }

    // Step 5: Build the clean title
    let result = [];

    if (anchor) {
        // Look for useful modifiers BEFORE the anchor
        for (let i = Math.max(0, anchorIndex - 3); i < anchorIndex; i++) {
            if (USEFUL_MODIFIERS.includes(words[i])) {
                result.push(words[i]);
            }
        }
        result.push(anchor);
    } else {
        // No anchor found - take first 3 non-junk words
        result = words.slice(0, 3);
    }

    // Step 6: Capitalize and return (max 4 words)
    return result
        .slice(0, 4)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/**
 * Generate multiple search variations for better matching
 * @param {string} rawTitle - The original Alibaba product title
 * @returns {string[]} - Array of search queries to try
 */
export function generateSearchQueries(rawTitle) {
    const primary = cleanTitle(rawTitle);
    const queries = [primary];

    // Also try just the anchor word alone
    const words = primary.toLowerCase().split(' ');
    const lastWord = words[words.length - 1];

    if (words.length > 1 && PRODUCT_ANCHORS.includes(lastWord)) {
        queries.push(lastWord.charAt(0).toUpperCase() + lastWord.slice(1));
    }

    return queries;
}
