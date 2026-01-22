import { describe, it, expect } from 'vitest';
import { cleanTitle, generateSearchQueries } from './cleaner.js';

describe('cleanTitle - Smart Keyword Extraction', () => {
    it('extracts "Bamboo Toothbrush" from B2B title', () => {
        const input = 'Factory Outlet Hotel Home 100% Biodegradable Nice Packing Bamboo Toothbrush with Custom Logo';
        expect(cleanTitle(input)).toBe('Bamboo Toothbrush');
    });

    it('extracts "Safety Razor" from complex title', () => {
        const input = "Yaqi Men's Safety Razor with Heavy Brass Handle Wet Double Edge & Blue Color";
        const result = cleanTitle(input);
        expect(result.toLowerCase()).toContain('razor');
    });

    it('extracts "Wireless Earbuds" from SEO title', () => {
        const input = 'Hot Sale 2024 New Arrival Premium TWS Wireless Bluetooth Earbuds Headphones';
        const result = cleanTitle(input);
        expect(result.toLowerCase()).toContain('earbuds');
    });

    it('keeps useful modifiers like "bamboo", "wireless"', () => {
        const input = 'Eco Friendly Bamboo Hair Brush Natural Wooden';
        const result = cleanTitle(input);
        expect(result.toLowerCase()).toContain('bamboo');
        expect(result.toLowerCase()).toContain('brush');
    });

    it('removes B2B junk words', () => {
        const input = 'OEM ODM Factory Wholesale Custom Logo Leather Wallet';
        const result = cleanTitle(input);
        expect(result.toLowerCase()).not.toContain('oem');
        expect(result.toLowerCase()).not.toContain('factory');
        expect(result.toLowerCase()).toContain('wallet');
    });

    it('handles empty input gracefully', () => {
        expect(cleanTitle('')).toBe('');
        expect(cleanTitle(null)).toBe('');
        expect(cleanTitle(undefined)).toBe('');
    });

    it('limits output to max 4 words', () => {
        const input = 'Super Ultra Premium Professional Electric Rechargeable Portable Mini Hair Trimmer';
        const result = cleanTitle(input);
        expect(result.split(' ').length).toBeLessThanOrEqual(4);
    });
});

describe('generateSearchQueries', () => {
    it('generates primary and fallback queries', () => {
        const input = 'Bamboo Hair Brush';
        const queries = generateSearchQueries(input);
        expect(queries.length).toBeGreaterThanOrEqual(1);
        expect(queries[0].toLowerCase()).toContain('brush');
    });
});
