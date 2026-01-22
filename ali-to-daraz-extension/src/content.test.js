import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const contentScriptPath = path.resolve(__dirname, './content.js');
const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf8');

// Mock Chrome APIs
global.chrome = {
    runtime: {
        getURL: vi.fn().mockReturnValue('chrome-extension://id/src/sidebar/index.html'),
        onMessage: {
            addListener: vi.fn()
        }
    },
    storage: {
        local: {
            set: vi.fn(),
            get: vi.fn()
        }
    }
};

describe('content.js', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        vi.clearAllMocks();
        // Clear global state if any
        // Since content.js is not a module, variables like sidebarIframe might persist
        // We evaluate in a way that clears them or mock them.
    });

    const runScript = () => {
        // Evaluate the code directly to handle top-level variables correctly per test
        // By using a function wrapper, we can localise the variables
        const fn = new Function('chrome', 'console', 'window', 'document', contentScriptCode);
        fn(global.chrome, console, window, document);
        // Manual trigger for init since it checks readyState or adds listener
        document.dispatchEvent(new Event('DOMContentLoaded'));
    };

    it('should scrape product data from meta tags', () => {
        document.head.innerHTML = `
            <meta property="og:title" content="Alibaba Item - Alibaba.com">
            <meta property="og:image" content="https://image.com/item.jpg">
        `;

        runScript();

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            expect.objectContaining({
                aliProduct: expect.objectContaining({
                    title: 'Alibaba Item',
                    image: 'https://image.com/item.jpg'
                })
            })
        );
    });

    it('should create FAB on initialization', () => {
        runScript();
        const fab = document.getElementById('ali-to-daraz-fab');
        expect(fab).not.toBeNull();
        expect(fab.innerText).toContain('Compare on Daraz');
    });

    it('should toggle sidebar when FAB is clicked', () => {
        runScript();
        const fab = document.getElementById('ali-to-daraz-fab');
        fab.click();

        const iframe = document.querySelector('iframe');
        expect(iframe).not.toBeNull();
        expect(iframe.src).toBe('chrome-extension://id/src/sidebar/index.html');
    });
});
