import { describe, it, expect } from 'vitest';
import { parseDarazJson, parseDarazHtml } from './parser';

describe('parseDarazJson', () => {
    it('should parse valid JSON with product data', () => {
        const mockJson = {
            mods: {
                listItems: [
                    {
                        name: 'Product 1',
                        price: '100',
                        image: 'img1.jpg',
                        itemUrl: '//daraz.com.bd/p1',
                        ratingScore: '4.5'
                    },
                    {
                        name: 'Product 2',
                        price: '200',
                        image: 'img2.jpg',
                        itemUrl: 'https://daraz.com.bd/p2',
                        ratingScore: '4.0'
                    }
                ]
            }
        };

        const results = parseDarazJson(mockJson);

        expect(results).toHaveLength(2);
        expect(results[0]).toEqual({
            title: 'Product 1',
            price: '100',
            image: 'img1.jpg',
            url: 'https://daraz.com.bd/p1',
            rating: '4.5'
        });
        expect(results[1].url).toBe('https://daraz.com.bd/p2');
    });

    it('should return empty array if mods.listItems is missing', () => {
        const mockJson = { mods: {} };
        const results = parseDarazJson(mockJson);
        expect(results).toEqual([]);
    });

    it('should return empty array for null input', () => {
        expect(parseDarazJson(null)).toEqual([]);
        expect(parseDarazJson(undefined)).toEqual([]);
    });

    it('should limit results to 5 items', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({
            name: `Product ${i}`,
            price: `${i}`,
            image: `img${i}.jpg`,
            itemUrl: `//daraz.com.bd/p${i}`,
            ratingScore: '5'
        }));
        const mockJson = { mods: { listItems: items } };

        const results = parseDarazJson(mockJson);
        expect(results).toHaveLength(5);
    });
});

describe('parseDarazHtml', () => {
    it('should return empty array for HTML without pageData', () => {
        const mockHtml = '<html><body></body></html>';
        const results = parseDarazHtml(mockHtml);
        expect(results).toEqual([]);
    });
});
