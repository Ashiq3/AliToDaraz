import React, { useEffect, useState } from 'react'
import { cleanTitle } from '../utils/cleaner';

export default function Sidebar() {
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [searchMode, setSearchMode] = useState('visual'); // 'visual' or 'keyword'

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            loadData();

            const handleMessage = (event) => {
                if (event.data?.type === 'REFRESH_DATA') {
                    loadData();
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);

        } else {
            setLoading(false);
            setProduct({
                title: "Premium Razor",
                originalTitle: "Factory Outlet Premium Razor",
                image: "https://via.placeholder.com/150"
            });
        }
    }, []);

    const loadData = () => {
        chrome.storage.local.get(['aliProduct'], (result) => {
            if (result.aliProduct) {
                const cleaned = cleanTitle(result.aliProduct.title);
                setProduct({
                    ...result.aliProduct,
                    title: cleaned,
                    originalTitle: result.aliProduct.title
                });
                // AUTO: Start with Visual Search for better matching!
                performVisualSearch(result.aliProduct.image);
            } else {
                setLoading(false);
                setError("No product data found. Refresh Alibaba.");
            }
        });
    };

    // NEW: Visual Search (Primary Method)
    const performVisualSearch = (imageUrl) => {
        setLoading(true);
        setError(null);
        setResults([]);
        setSearchMode('visual');

        if (!imageUrl) {
            setError("No product image available for visual search.");
            setLoading(false);
            return;
        }

        console.log("[Sidebar] Starting visual search for:", imageUrl);

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "VISUAL_SEARCH", imageUrl }, (response) => {
                setLoading(false);

                if (chrome.runtime.lastError) {
                    console.error("[Sidebar] Chrome error:", chrome.runtime.lastError);
                    setError("Extension error. Try keyword search instead.");
                    return;
                }

                console.log("[Sidebar] Visual search response:", response);

                if (response?.status === "success" && response.results?.length > 0) {
                    setResults(response.results);
                } else if (response?.fallbackSuggested) {
                    // No visual results - offer keyword search
                    setError("No visual matches on Daraz. Try keyword search below.");
                } else {
                    setError("Visual search found no Daraz products. Try keyword search.");
                }
            });
        } else {
            setLoading(false);
            setError("Extension API unavailable.");
        }
    };

    const performKeywordSearch = (overrideQuery) => {
        const query = overrideQuery || product?.title;
        if (!query) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setSearchMode('keyword');

        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: "SEARCH_DARAZ", query: query }, (response) => {
                setLoading(false);
                if (chrome.runtime.lastError) {
                    setError(chrome.runtime.lastError.message);
                    return;
                }

                if (response?.status === "success") {
                    setResults(response.results);
                } else {
                    setError("No keyword matches found.");
                }
            });
        }
    };

    const retryVisualSearch = () => {
        if (product?.image) {
            performVisualSearch(product.image);
        }
    };

    return (
        <div className="w-full h-screen bg-[#F8F9FA] flex flex-col font-sans text-gray-900 border-l border-white/20 overflow-hidden">
            {/* Premium Header */}
            <header className="px-6 py-4 glass-panel sticky top-0 z-20 flex justify-between items-center shadow-lg shadow-black/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                        <span className="text-xl">🔍</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">
                        AliTo<span className="text-[#F36F21]">Daraz</span>
                    </h1>
                </div>
                <button
                    onClick={() => window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*')}
                    className="w-10 h-10 flex items-center justify-center hover:bg-black/5 rounded-xl text-gray-400 hover:text-gray-900 transition-all cursor-pointer"
                >
                    <span className="text-xl">✕</span>
                </button>
            </header>

            {/* Search Mode Indicator */}
            <div className="p-4 bg-white/60 backdrop-blur-md border-b border-white/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wider ${searchMode === 'visual' ? 'text-purple-600' : 'text-orange-500'}`}>
                            {searchMode === 'visual' ? '📷 Visual Match' : '🔤 Keyword Search'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={retryVisualSearch}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${searchMode === 'visual' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-purple-50'}`}
                        >
                            📷 Visual
                        </button>
                        <button
                            onClick={performKeywordSearch}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${searchMode === 'keyword' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500 hover:bg-orange-50'}`}
                        >
                            🔤 Keyword
                        </button>
                    </div>
                </div>

                {/* Product Preview */}
                {product && (
                    <div className="mt-4 flex gap-3 items-start">
                        {product.image && (
                            <img
                                src={product.image}
                                alt=""
                                className="w-16 h-16 rounded-xl object-cover shadow-md border border-gray-100"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Alibaba Product</p>
                            <p className="text-[13px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight mt-1">
                                {product.title}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Dynamic Results Area */}
            <main className="flex-1 p-6 overflow-y-auto space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-20">
                        <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                        <div className="text-center space-y-2">
                            <p className="text-purple-600 text-sm font-bold">
                                {searchMode === 'visual' ? 'Analyzing Image...' : 'Searching Daraz...'}
                            </p>
                            <p className="text-gray-400 text-xs">
                                {searchMode === 'visual' ? 'Using Google Lens to find visual matches' : 'Finding matching products'}
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center text-center space-y-4 py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-2xl">⚠️</div>
                        <p className="text-gray-600 text-[13px] font-medium leading-relaxed">{error}</p>

                        {searchMode === 'visual' && (
                            <button
                                onClick={performKeywordSearch}
                                className="mt-4 px-6 py-3 bg-[#F36F21] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all cursor-pointer"
                            >
                                Try Keyword Search Instead
                            </button>
                        )}
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid gap-4 pb-12">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                {searchMode === 'visual' ? '📷 Visual Matches on Daraz' : '🔤 Keyword Matches'}
                            </p>
                            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
                                {results.length} found
                            </span>
                        </div>

                        {results.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group no-underline block glass-panel p-4 rounded-2xl hover:bg-white/80 transition-all hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex gap-4">
                                    {item.image && (
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-inner flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <p className="text-[14px] font-bold text-[#1A1A1A] line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                                            {item.title}
                                        </p>
                                        {item.price && (
                                            <p className="text-[18px] font-black text-[#F36F21]">{item.price}</p>
                                        )}
                                        <div className="pt-1 flex items-center justify-between">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-bold">
                                                {searchMode === 'visual' ? '📷 Visual Match' : '🔤 Keyword'}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-300 group-hover:text-orange-500 transition-colors">
                                                VIEW ON DARAZ →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center space-y-6 py-12 px-2">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-black/5 flex items-center justify-center text-3xl">📷</div>
                        <div className="space-y-2">
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Ready to Search</p>
                            <p className="text-[#1A1A1A] font-extrabold text-[15px] leading-tight px-6 line-clamp-3">
                                {product?.title || 'No product loaded'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={retryVisualSearch}
                                className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all cursor-pointer"
                            >
                                📷 Visual Search
                            </button>
                            <button
                                onClick={performKeywordSearch}
                                className="px-6 py-3 bg-[#F36F21] text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all cursor-pointer"
                            >
                                🔤 Keyword
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Premium Footer */}
            <footer className="p-4 bg-white border-t border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">AliToDaraz v2.0</span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Visual Mode</span>
                </div>
            </footer>
        </div>
    )
}
