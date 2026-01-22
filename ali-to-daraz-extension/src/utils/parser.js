/**
 * Parses JSON response from Daraz AJAX API
 * @param {Object} json - The JSON response from https://www.daraz.com.bd/catalog/?ajax=true&q=...
 * @returns {Array} List of formatted product objects
 */
export function parseDarazJson(json) {
    try {
        const items = json?.mods?.listItems || [];

        return items.slice(0, 5).map(item => ({
            title: item.name,
            price: item.price,
            image: item.image,
            url: item.itemUrl?.startsWith('//') ? 'https:' + item.itemUrl : item.itemUrl,
            rating: item.ratingScore
        }));
    } catch (e) {
        console.error("Parse error", e);
        return [];
    }
}

// Keep the old HTML parser as a fallback (not actively used)
export function parseDarazHtml(html) {
    const match = html.match(/window\.pageData\s*=\s*([\s\S]+?});/);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            return parseDarazJson(data);
        } catch (e) {
            console.error("Parse error", e);
            return [];
        }
    }
    return [];
}
