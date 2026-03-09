import { createContext, useContext, useEffect, useState } from 'react';
import { Colortly } from '../systems/Colortly';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';
export type ThemeStyle = 'classic' | 'clay' | 'mist' | 'royal' | 'bloom' | 'sage' | 'sand' | 'coffee' | 'nordic' | 'comic' | 'pop';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';
export type SidebarVisibility = 'pinned' | 'auto' | 'floating';

interface ThemeContextType {
    theme: Theme;
    themeStyle: ThemeStyle;
    activeThemeType: 'preset' | 'custom';
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

    // Custom Theme Config (Colortly Studio Persistence)
    customTheme: CustomThemeConfig;
    updateCustomTheme: (updates: Partial<CustomThemeConfig>) => void;

    // Reading Mode
    readingMode: boolean;
    toggleReadingMode: () => void;

    // Mobile Menu State
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    mobileNavStyle?: 'dock' | 'drawer';
    setMobileNavStyle?: (style: 'dock' | 'drawer') => void;
    isSettingsOpen?: boolean;
    setIsSettingsOpen?: (isOpen: boolean) => void;
}

export interface CustomThemeConfig {
    hue: number;
    saturation: number;
    texture: 'none' | 'noise' | 'glass' | 'dots' | 'grid';
    textureTarget: 'bg' | 'card' | 'both';
    textureIntensity: number;
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    borderStyle: 'clean' | 'contrast' | 'shadow';
}

const DEFAULT_CUSTOM_THEME: CustomThemeConfig = {
    hue: 220,
    saturation: 90,
    texture: 'none',
    textureTarget: 'bg',
    textureIntensity: 20,
    radius: 'md',
    borderStyle: 'clean'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Mode (Light/Dark)
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('vault_theme') as Theme) || 'light';
    });

    // Active Theme Engine Type
    const [activeThemeType, setActiveThemeType] = useState<'preset' | 'custom'>(() => {
        return (localStorage.getItem('vault_active_theme_type') as 'preset' | 'custom') || 'preset';
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

    // Apply Style (Managed by Colortly Brain for Presets)
    useEffect(() => {
        if (activeThemeType === 'preset') {
            Colortly.applyTheme(themeStyle, theme);
            localStorage.setItem('vault_theme_style', themeStyle);
        }
    }, [themeStyle, theme, activeThemeType]);

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

    // Custom Theme State
    const [customTheme, setCustomTheme] = useState<CustomThemeConfig>(() => {
        const saved = localStorage.getItem('vault_custom_theme_config');
        return saved ? { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(saved) } : DEFAULT_CUSTOM_THEME;
    });

    const updateCustomTheme = (updates: Partial<CustomThemeConfig>) => {
        setCustomTheme(prev => {
            const newState = { ...prev, ...updates };
            localStorage.setItem('vault_custom_theme_config', JSON.stringify(newState));
            return newState;
        });
        setActiveThemeType('custom');
        localStorage.setItem('vault_active_theme_type', 'custom');
    };

    // Apply Custom Theme (Persisted)
    useEffect(() => {
        if (activeThemeType !== 'custom') return;

        const root = document.documentElement;
        // Radius
        const radiusMap: Record<string, string> = { 'none': '0px', 'sm': '0.25rem', 'md': '0.75rem', 'lg': '1.25rem', 'full': '9999px' };
        root.style.setProperty('--radius-theme', radiusMap[customTheme.radius]);
        root.setAttribute('data-radius', customTheme.radius);

        // Texture
        root.setAttribute('data-texture', customTheme.texture);
        root.setAttribute('data-texture-target', customTheme.textureTarget);
        root.style.setProperty('--texture-intensity', (customTheme.textureIntensity / 100).toString());

        // Border Style
        root.setAttribute('data-border-style', customTheme.borderStyle);

        // Colors
        const h = customTheme.hue;
        const s = customTheme.saturation;
        root.style.setProperty('--color-primary', `hsl(${h}, ${s}%, 50%)`);
        const lightnessMap: Record<number, number> = {
            50: 98, 100: 95, 200: 90, 300: 82, 400: 64,
            500: 50, 600: 40, 700: 30, 800: 20, 900: 12, 950: 6
        };
        Object.entries(lightnessMap).forEach(([stop, l]) => {
            root.style.setProperty(`--color-app-${stop}`, `hsl(${h}, ${s}%, ${l}%)`);
        });
    }, [customTheme, activeThemeType, theme]); // Re-run custom theme if mode changes but type is custom


    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setThemeStyle = (style: ThemeStyle) => {
        setThemeStyleState(style);
        setActiveThemeType('preset');
        localStorage.setItem('vault_active_theme_type', 'preset');
    };

    // Reading Mode State
    const [readingMode, setReadingMode] = useState<boolean>(() => {
        return localStorage.getItem('vault_reading_mode') === 'true';
    });

    const toggleReadingMode = () => {
        setReadingMode(prev => {
            const newValue = !prev;
            localStorage.setItem('vault_reading_mode', String(newValue));
            return newValue;
        });
    };

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    // Apply Reading Mode (Side effect)
    useEffect(() => {
        if (readingMode) {
            document.documentElement.setAttribute('data-reading-mode', 'true');
        } else {
            document.documentElement.removeAttribute('data-reading-mode');
        }
    }, [readingMode]);

    return (
        <ThemeContext.Provider value={{
            theme,
            themeStyle,
            activeThemeType,
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
            closeTab,
            customTheme,
            updateCustomTheme,
            readingMode,
            toggleReadingMode,
            isMobileMenuOpen,
            setIsMobileMenuOpen
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

