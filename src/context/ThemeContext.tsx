import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';
export type ThemeStyle = 'classic' | 'clay' | 'mist' | 'royal' | 'bloom' | 'sage' | 'sand' | 'coffee' | 'nordic' | 'comic' | 'pop';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';
export type SidebarVisibility = 'pinned' | 'auto' | 'floating';

interface ThemeContextType {
    theme: Theme;
    themeStyle: ThemeStyle;
    toggleTheme: () => void;
    setThemeStyle: (style: ThemeStyle) => void;

    // Legacy support (to be deprecated or mapped to visibility)
    isSidebarCollapsed: boolean;
    toggleSidebarCollapsed: () => void;

    // New Navigation Config
    sidebarPosition: SidebarPosition;
    setSidebarPosition: (pos: SidebarPosition) => void;
    sidebarVisibility: SidebarVisibility;
    setSidebarVisibility: (vis: SidebarVisibility) => void;

    // Tabs
    openTabs: string[];
    addTab: (path: string) => void;
    closeTab: (path: string) => void;

    // Navigation Mode
    navMode: 'normal' | 'simple' | 'essential' | 'custom';
    setNavigationMode: (mode: 'normal' | 'simple' | 'essential' | 'custom') => void;
    customModeItems: string[];
    toggleCustomModeItem: (itemId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Mode (Light/Dark)
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('vault_theme') as Theme) || 'light';
    });

    // Style (Color Palette)
    const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(() => {
        return (localStorage.getItem('vault_theme_style') as ThemeStyle) || 'classic';
    });

    // Apply Mode
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('vault_theme', theme);
    }, [theme]);

    // Apply Style
    useEffect(() => {
        const root = window.document.documentElement;
        if (themeStyle === 'classic') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', themeStyle);
        }
        localStorage.setItem('vault_theme_style', themeStyle);
    }, [themeStyle]);

    // New Navigation Configuration
    const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
        return (localStorage.getItem('vault_sidebar_position') as SidebarPosition) || 'left';
    });

    const [sidebarVisibility, setSidebarVisibilityState] = useState<SidebarVisibility>(() => {
        return (localStorage.getItem('vault_sidebar_visibility') as SidebarVisibility) || 'pinned';
    });

    const setSidebarPosition = (pos: SidebarPosition) => {
        setSidebarPositionState(pos);
        localStorage.setItem('vault_sidebar_position', pos);
    };

    const setSidebarVisibility = (vis: SidebarVisibility) => {
        setSidebarVisibilityState(vis);
        localStorage.setItem('vault_sidebar_visibility', vis);
    };

    // Legacy Sidebar State (Mapped to visibility for backward compatibility if needed)
    // We keep this for now to not break existing calls, but logic might shift.
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        return localStorage.getItem('vault_sidebar_collapsed') === 'true';
    });

    const toggleSidebarCollapsed = () => {
        setIsSidebarCollapsed(prev => {
            const newValue = !prev;
            localStorage.setItem('vault_sidebar_collapsed', String(newValue));
            return newValue;
        });
    };

    // Navigation Mode State
    const [navMode, setNavMode] = useState<'normal' | 'simple' | 'essential' | 'custom'>(() => {
        return (localStorage.getItem('vault_nav_mode') as 'normal' | 'simple' | 'essential' | 'custom') || 'normal';
    });

    // OPEN TABS STATE
    const [openTabs, setOpenTabs] = useState<string[]>(() => {
        const saved = localStorage.getItem('vault_open_tabs');
        // Default to dashboard if empty
        return saved ? JSON.parse(saved) : ['/'];
    });

    const addTab = (path: string) => {
        setOpenTabs(prev => {
            if (prev.includes(path)) return prev;
            const newTabs = [...prev, path];
            localStorage.setItem('vault_open_tabs', JSON.stringify(newTabs));
            return newTabs;
        });
    };

    const closeTab = (path: string) => {
        setOpenTabs(prev => {
            if (prev.length <= 1) return prev; // Don't close last tab
            const newTabs = prev.filter(p => p !== path);
            localStorage.setItem('vault_open_tabs', JSON.stringify(newTabs));
            return newTabs;
        });
    };

    // Custom Mode Memory (Persisted)
    const [customModeItems, setCustomModeItems] = useState<string[]>(() => {
        const saved = localStorage.getItem('vault_custom_mode_items');
        return saved ? JSON.parse(saved) : [];
    });

    const setNavigationMode = (mode: 'normal' | 'simple' | 'essential' | 'custom') => {
        setNavMode(mode);
        localStorage.setItem('vault_nav_mode', mode);
    };

    const toggleCustomModeItem = (itemId: string) => {
        setCustomModeItems(prev => {
            const newItems = prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId];
            localStorage.setItem('vault_custom_mode_items', JSON.stringify(newItems));
            return newItems;
        });
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setThemeStyle = (style: ThemeStyle) => {
        setThemeStyleState(style);
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            themeStyle,
            toggleTheme,
            setThemeStyle,
            isSidebarCollapsed,
            toggleSidebarCollapsed,
            sidebarPosition,
            setSidebarPosition,
            sidebarVisibility,
            setSidebarVisibility,
            navMode,
            setNavigationMode,
            customModeItems,
            toggleCustomModeItem,
            openTabs,
            addTab,
            closeTab
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
