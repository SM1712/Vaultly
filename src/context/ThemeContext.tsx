import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';
// Updated Theme Styles
export type ThemeStyle = 'classic' | 'clay' | 'mist' | 'royal' | 'bloom' | 'sage' | 'sand' | 'coffee' | 'nordic' | 'comic' | 'pop';

interface ThemeContextType {
    theme: Theme; // Light/Dark
    themeStyle: ThemeStyle; // Color Palette
    toggleTheme: () => void;
    setThemeStyle: (style: ThemeStyle) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Mode (Light/Dark) - DEFAULT LIGHT
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('vault_theme');
        return (saved as Theme) || 'light';
    });

    // Style (Color Palette)
    const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(() => {
        const saved = localStorage.getItem('vault_theme_style');
        return (saved as ThemeStyle) || 'classic';
    });

    // Apply Mode (Light/Dark)
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('vault_theme', theme);
    }, [theme]);

    // Apply Style (Attribute for CSS variables)
    useEffect(() => {
        const root = window.document.documentElement;
        // If classic, remove attribute to fallback to default :root
        if (themeStyle === 'classic') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', themeStyle);
        }
        localStorage.setItem('vault_theme_style', themeStyle);
    }, [themeStyle]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const setThemeStyle = (style: ThemeStyle) => {
        setThemeStyleState(style);
    };

    return (
        <ThemeContext.Provider value={{ theme, themeStyle, toggleTheme, setThemeStyle }}>
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
