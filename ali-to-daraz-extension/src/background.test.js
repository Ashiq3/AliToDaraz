import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Chrome APIs
global.chrome = {
    runtime: {
        onInstalled: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn() }
    },
    contextMenus: {
        create: vi.fn(),
        onClicked: { addListener: vi.fn() }
    },
    tabs: {
        sendMessage: vi.fn()
    }
};

// Mock fetch
global.fetch = vi.fn();

describe('background.js', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Since background.js uses top-level code, we need to handle it carefully.
        // For testing purposes, we can reset modules and re-import
        vi.resetModules();
        await import('./background.js');
    });

    it('should create context menu on install', () => {
        // Trigger the onInstalled listener
        const onInstalledListener = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
        onInstalledListener();
        expect(chrome.contextMenus.create).toHaveBeenCalledWith(expect.objectContaining({
            id: 'aliToDarazCompare'
        }));
    });

    it('should send message to tab when context menu is clicked', () => {
        const onClickedListener = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
        onClickedListener({ menuItemId: 'aliToDarazCompare', selectionText: 'test' }, { id: 123 });

        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
            action: 'CONTEXT_SEARCH_TRIGGER',
            text: 'test'
        });
    });

    it('should handle SEARCH_DARAZ message', async () => {
        const onMessageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0];

        const mockJson = { mods: { listItems: [{ name: "Result", price: "10", image: "i.jpg", itemUrl: "//d.com/p" }] } };
        global.fetch.mockResolvedValue({
            json: () => Promise.resolve(mockJson)
        });

        const sendResponse = vi.fn();
        const result = onMessageListener({ action: 'SEARCH_DARAZ', query: 'item' }, {}, sendResponse);

        // It should return true for async response
        expect(result).toBe(true);

        // Wait for fetch pulses
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

        expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
            status: 'success',
            results: expect.arrayContaining([
                expect.objectContaining({ title: 'Result' })
            ])
        }));
    });
});
