import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from './Sidebar';
import React from 'react';

// Mock Chrome API
const mockChrome = {
    storage: {
        local: {
            get: vi.fn(),
            set: vi.fn()
        }
    },
    runtime: {
        sendMessage: vi.fn(),
        onMessage: { addListener: vi.fn() },
        lastError: null
    }
};
global.chrome = mockChrome;

describe('Sidebar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should load initial data from storage', async () => {
        mockChrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ aliProduct: { title: "Test Item", image: "img.jpg" } });
        });

        render(<Sidebar />);

        // Should show the title (in cleaned format)
        await waitFor(() => {
            expect(screen.getByText("Test Item")).toBeInTheDocument();
        });

        // Should NOT show "Ready to compare" because it now AUTO-SEARCHES
        expect(screen.queryByText(/Ready to compare/i)).not.toBeInTheDocument();
    });

    it('should show results from automatic visual search', async () => {
        mockChrome.storage.local.get.mockImplementation((keys, callback) => {
            callback({ aliProduct: { title: "Test Item", image: "img.jpg" } });
        });

        // Mock successful Visual Search response
        mockChrome.runtime.sendMessage.mockImplementation((msg, callback) => {
            if (msg.action === "VISUAL_SEARCH") {
                callback({
                    status: "success",
                    results: [{ title: "Found Item", price: "500", url: "#", image: "" }]
                });
            }
        });

        render(<Sidebar />);

        // Should show results without manual click
        await waitFor(() => {
            expect(screen.getByText("Found Item")).toBeInTheDocument();
        });

        expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ action: "VISUAL_SEARCH", imageUrl: "img.jpg" }),
            expect.any(Function)
        );
    });
});
