import { useState, useMemo } from 'react';
import {
    Search, ChevronRight, ArrowLeft, BookOpen
} from 'lucide-react';
import { encyclopediaData } from '../../data/encyclopediaData';
import type { DocBlock } from '../../data/encyclopediaData';
import { clsx } from 'clsx';

export const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

    // --- Search Logic ---
    const filteredSections = useMemo(() => {
        if (!searchTerm) return encyclopediaData;

        return encyclopediaData.map(section => ({
            ...section,
            articles: section.articles.filter(article =>
                article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(section => section.articles.length > 0);
    }, [searchTerm]);

    const activeArticle = useMemo(() => {
        if (!selectedArticleId) return null;
        for (const section of encyclopediaData) {
            const found = section.articles.find(a => a.id === selectedArticleId);
            if (found) return found;
        }
        return null;
    }, [selectedArticleId]);

    // --- Mobile Navigation Helpers ---
    const goBack = () => {
        if (selectedArticleId) {
            setSelectedArticleId(null);
        } else if (selectedCategory) {
            setSelectedCategory(null);
        }
    };

    // --- Renderers ---
    const renderBlock = (block: DocBlock, idx: number) => {
        switch (block.type) {
            case 'text':
                return <p key={idx} className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">{block.content}</p>;
            case 'heading':
                return <h3 key={idx} className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-6 mb-3">{block.content}</h3>;
            case 'list':
                return (
                    <ul key={idx} className="space-y-2 mb-4 ml-1">
                        {block.items.map((item, i) => (
                            <li key={i} className="flex gap-2 text-zinc-600 dark:text-zinc-400 text-sm">
                                <span className="text-indigo-500 font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                );
            case 'alert':
                const colors = {
                    info: "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
                    warning: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
                    tip: "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                };
                return (
                    <div key={idx} className={clsx("p-4 rounded-xl border mb-4 text-sm", colors[block.variant])}>
                        <strong>{block.variant === 'tip' ? '💡 Tip:' : block.variant === 'warning' ? '⚠️ Importante:' : 'ℹ️ Dato:'}</strong> {block.content}
                    </div>
                );
            case 'code':
                return (
                    <div key={idx} className="bg-zinc-900 text-zinc-300 font-mono text-xs p-4 rounded-xl mb-4 overflow-x-auto shadow-inner">
                        <code>{block.content}</code>
                    </div>
                );
            case 'example':
                return (
                    <div key={idx} className="my-6">
                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Ejemplo Interactivo: {block.title}</div>
                        {block.content}
                    </div>
                );
            default:
                return null;
        }
    };

    // --- Views ---

    // 1. Sidebar / Main Menu (Mobile)
    const renderMenu = () => (
        <div className={clsx("h-full flex flex-col", (selectedArticleId || (selectedCategory && window.innerWidth < 768)) ? "hidden md:flex" : "flex")}>
            {/* Search Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Enciclopedia</h2>
                        <p className="text-xs text-zinc-500">Documentación v2.0</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar temas..."
                        className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Topics List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 md:pb-4">
                {filteredSections.map(section => (
                    <div key={section.id} className="overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">

                        {/* Section Header (Clickable on Mobile to drill down, Header on Desktop) */}
                        <div
                            onClick={() => setSelectedCategory(section.id)}
                            className="p-4 flex items-center justify-between cursor-pointer md:cursor-default hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400">
                                    <section.icon size={18} />
                                </div>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{section.title}</span>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400 md:hidden" />
                        </div>

                        {/* Articles List (Always visible on Desktop, Hidden on Mobile until drilled down logic handled differently but for now simple expand) */}
                        <div className="hidden md:block border-t border-zinc-100 dark:border-zinc-800">
                            {section.articles.map(article => (
                                <button
                                    key={article.id}
                                    onClick={() => setSelectedArticleId(article.id)}
                                    className={clsx(
                                        "w-full text-left p-3 pl-14 text-sm font-medium transition-all border-l-2",
                                        selectedArticleId === article.id
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                            : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                                    )}
                                >
                                    {article.title}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // 2. Category Detail View (Mobile Only)
    const renderMobileCategory = () => {
        if (!selectedCategory || selectedArticleId) return null;
        const section = filteredSections.find(s => s.id === selectedCategory);
        if (!section) return null;

        return (
            <div className="h-full flex flex-col md:hidden bg-zinc-50 dark:bg-zinc-950">
                <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 sticky top-0 z-10">
                    <button onClick={goBack} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{section.title}</h3>
                </div>
                <div className="p-4 space-y-3 flex-1 overflow-y-auto pb-24">
                    {section.articles.map(article => (
                        <button
                            key={article.id}
                            onClick={() => setSelectedArticleId(article.id)}
                            className="w-full bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform"
                        >
                            <div>
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-left">{article.title}</h4>
                                <p className="text-xs text-zinc-500 text-left mt-1 line-clamp-1">{article.description}</p>
                            </div>
                            <ChevronRight size={16} className="text-zinc-400" />
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // 3. Article Content (Responsive)
    const renderArticle = () => {
        if (!activeArticle) {
            // Empty State (Desktop)
            return (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-400 p-12 text-center">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                        <BookOpen size={48} className="opacity-20" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Selecciona un artículo</h3>
                    <p className="max-w-xs mx-auto">Explora la documentación para dominar todas las funciones de Vault.</p>
                </div>
            );
        }

        return (
            <div className={clsx("fixed inset-0 z-50 md:static md:z-auto bg-zinc-50 dark:bg-black md:bg-transparent flex flex-col md:flex-1",
                selectedArticleId ? "flex" : "hidden md:flex"
            )}>
                {/* Article Header */}
                <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 md:p-8 sticky top-0 z-10 flex items-center gap-4">
                    <button onClick={goBack} className="md:hidden p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 uppercase tracking-wide">
                                Wiki
                            </span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-400">Lectura de 3 min</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                            {activeArticle.title}
                        </h1>
                    </div>
                </div>

                {/* Article Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 md:max-w-3xl pb-24 md:pb-12">
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium mb-8 border-l-4 border-indigo-500 pl-4">
                        {activeArticle.description}
                    </p>

                    <div className="space-y-2">
                        {activeArticle.blocks.map((block, idx) => renderBlock(block, idx))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-400">
                        <span>¿Fue útil este artículo?</span>
                        <div className="flex gap-2">
                            <button className="hover:text-indigo-500 transition-colors">👍 Sí</button>
                            <button className="hover:text-rose-500 transition-colors">👎 No</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Sidebar (Desktop) / Main Nav (Mobile) */}
            <div className={clsx("w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0",
                selectedCategory && window.innerWidth < 768 ? "hidden" : "block"
            )}>
                {renderMenu()}
            </div>

            {/* Mobile Drilled Views (Overlays) */}
            {renderMobileCategory()}

            {/* Main Content Pane */}
            {renderArticle()}
        </div>
    );
};
