
export interface ThemeColorPalette {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
}

export type ThemeRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type ThemeMode = 'light' | 'dark';
export type ThemeTexture = 'none' | 'noise' | 'glass' | 'dots' | 'grid';

export interface ThemeConfig {
    id: string;
    name: string;
    description: string; // New field for preset cards
    type: ThemeMode;

    // Core Colors
    colors: {
        primary: string;
        app: ThemeColorPalette;
    };

    // Atmospheres 
    radius: ThemeRadius;
    texture: ThemeTexture;

    displayColor: string;
}

export const THEMES: ThemeConfig[] = [
    {
        id: 'classic',
        name: 'Soft Stone',
        description: 'La base sólida y confiable. Minimalista por excelencia.',
        type: 'light',
        displayColor: 'bg-[#a8a29e]',
        radius: 'md',
        texture: 'none',
        colors: {
            primary: '#57534e',
            app: {
                50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
                400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
                800: '#292524', 900: '#1c1917', 950: '#0c0a09'
            }
        }
    },
    {
        id: 'sunset', // Was Clay
        name: 'Sunset Glow',
        description: 'Cálido y energético, como una tarde de verano.',
        type: 'light',
        displayColor: 'bg-gradient-to-br from-orange-400 to-red-500',
        radius: 'lg',
        texture: 'noise',
        colors: {
            primary: '#ea500c',
            app: {
                50: '#fff8f1', 100: '#ffe8d1', 200: '#fed0a0', 300: '#fdb072',
                400: '#fb8c45', 500: '#f96d20', 600: '#ea500c', 700: '#c23a0c',
                800: '#9a2b12', 900: '#7c2412', 950: '#431007'
            }
        }
    },
    {
        id: 'ocean', // Was Nordic
        name: 'Deep Ocean',
        description: 'Sereno, profesional y profundo. Inspirado en el mar del norte.',
        type: 'light',
        displayColor: 'bg-gradient-to-br from-sky-400 to-blue-600',
        radius: 'sm',
        texture: 'glass',
        colors: {
            primary: '#0ea5e9',
            app: {
                50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
                400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
                800: '#075985', 900: '#0c4a6e', 950: '#082f49'
            }
        }
    },
    {
        id: 'forest', // Was Sage
        name: 'Forest Rain',
        description: 'Orgánico y natural. Perfecto para enfocar la mente.',
        type: 'light',
        displayColor: 'bg-gradient-to-br from-emerald-400 to-green-600',
        radius: 'md',
        texture: 'dots',
        colors: {
            primary: '#10b981',
            app: {
                50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
                400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
                800: '#065f46', 900: '#064e3b', 950: '#022c22'
            }
        }
    },
    {
        id: 'midnight', // Was Mist (Redesigned to be Dark/Purple-ish)
        name: 'Midnight Jazz',
        description: 'Elegante, oscuro y sofisticado.',
        type: 'dark', // Intentionally dark-leaning palette logic
        displayColor: 'bg-gradient-to-br from-indigo-500 to-slate-800',
        radius: 'md',
        texture: 'noise',
        colors: {
            primary: '#6366f1',
            app: {
                50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
                400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
                800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
            }
        }
    },
    {
        id: 'bloom',
        name: 'Bloom Flower',
        description: 'Delicado, floral y lleno de vida. Textura HD.',
        type: 'light',
        displayColor: 'bg-gradient-to-br from-pink-400 to-rose-500',
        radius: 'lg',
        texture: 'noise',
        colors: {
            primary: '#e11d4d',
            app: {
                50: '#fff5f6', 100: '#ffe9ec', 200: '#ffcfd6', 300: '#fda4b3',
                400: '#fa748d', 500: '#f43f63', 600: '#e11d4d', 700: '#be123e',
                800: '#9f1239', 900: '#881337', 950: '#4c0519'
            }
        }
    },
    {
        id: 'comic', // Kept but refined
        name: 'Comic Book',
        description: 'Vibrante, plano y divertido. Bordes fuertes y tramas.',
        type: 'light',
        displayColor: 'bg-yellow-400 border-2 border-black',
        radius: 'none',
        texture: 'grid',
        colors: {
            primary: '#f59e0b',
            app: {
                50: '#fffbeb', 100: '#fef3c7', 200: '#fde047', 300: '#fcd34d',
                400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
                800: '#92400e', 900: '#78350f', 950: '#451a03'
            }
        }
    },
    {
        id: 'cyber', // Was Pop
        name: 'Cyber Punk',
        description: 'El futuro es neón. Alto contraste digital.',
        type: 'dark',
        displayColor: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500',
        radius: 'none',
        texture: 'grid',
        colors: {
            primary: '#ec4899', // Pink-500
            app: {
                50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4',
                400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d',
                800: '#9d174d', 900: '#831843', 950: '#500724'
            }
        }
    }
];

// Helper Type
export type ThemeId = string;

export const Colortly = {
    getAllThemes: () => THEMES,

    getTheme: (id: string): ThemeConfig => {
        return THEMES.find(t => t.id === id) || THEMES[0];
    },

    applyTheme: (themeId: string, mode: ThemeMode = 'light') => {
        const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
        const root = document.documentElement;

        // Metadata
        root.setAttribute('data-theme', themeId);
        root.setAttribute('data-radius', theme.radius);

        // Force "Clean" (No Texture) in Dark Mode to avoid noise/grid clashes
        // The Aurora effect provides the texture/depth instead.
        if (mode === 'dark') {
            root.setAttribute('data-texture', 'none');
        } else {
            root.setAttribute('data-texture', theme.texture);
        }

        // Inject CSS Variables
        const setVar = (name: string, value: string) => {
            root.style.setProperty(name, value);
        };

        // 1. Primary (Always same hue, maybe adjust lightness in future but keep brand identity)
        setVar('--color-primary', theme.colors.primary);

        // 2. Palette Generation
        if (mode === 'dark') {
            // SMART DARK MODE ENGINE
            // Instead of using the raw theme palette (which might be green/orange),
            // we generate a "Professional Dark" palette on the fly.
            // Logic: Mix Neutral Zinc with 5-10% of the Theme Primary Color.

            // Helper to hex mix (Simplified visual approximation logic)
            // Ideally we'd use color-mix in CSS, but for stability we hardcode specific darks

            // We map the "app" scale to Dark Neutral equivalents
            // 50 (Text/Highlight) -> Whiteish
            // 950 (Background) -> Deep Black/Gray with Tint

            // These are manually tuned "Zinc-like" colors with slight saturation
            // We rely on CSS color-mix to tint them dynamically with the primary color

            // 50-950 mapping is INVERTED for the UI logic usually (bg-zinc-50 is light), 
            // BUT Tailwind Dark Mode swaps classes (bg-white -> dark:bg-zinc-900).
            // So we need:
            // --color-app-900 (Used in dark:bg-zinc-900) -> A GOOD BACKGROUND COLOR (Dark)
            // --color-app-50  (Used in bg-zinc-50) -> A GOOD BACKGROUND COLOR (Light)

            // Wait, index.css maps zinc-50 -> app-50.
            // In Dark Mode, components use dark:bg-zinc-900.
            // So for Dark Mode to look good, app-900 must be a RICH DARK color.
            // Currently it is getting the raw theme-900 (e.g. Forest Green).

            // Solution: We overwrite the 800-950 range with "Smart Neutrals" 
            // and the 50-200 range with "Dimmed Lights" if needed, 
            // but effectively we keep the structure.

            // We use CSS color-mix to inject the tint perfectly.

            setVar('--color-app-50', '#fafafa'); // Text Base
            setVar('--color-app-100', '#f4f4f5');
            setVar('--color-app-200', '#e4e4e7');
            setVar('--color-app-300', '#d4d4d8');
            setVar('--color-app-400', '#a1a1aa');
            setVar('--color-app-500', '#71717a');

            // Critical: The Dark Backgrounds
            // We mix Zinc-900 (#18181b) with the Theme Primary.
            // 900 = Card Backgrounds typically
            setVar('--color-app-600', '#52525b');
            setVar('--color-app-700', '#3f3f46');

            // Reduced mix-in for a cleaner, luxurious dark (less muddy)
            setVar('--color-app-800', `color-mix(in srgb, #18181b, ${theme.colors.primary} 3%)`);
            setVar('--color-app-900', `color-mix(in srgb, #09090b, ${theme.colors.primary} 4%)`); // Card Bg
            setVar('--color-app-950', '#000000'); // Deepest Black for Body Base (glows sit on top)

        } else {
            // LIGHT MODE: Unchanged (Rich Tinted Backgrounds)
            Object.entries(theme.colors.app).forEach(([stop, color]) => {
                setVar(`--color-app-${stop}`, color);
            });
        }

        // 3. Radius
        const radiusMap: Record<ThemeRadius, string> = {
            'none': '0px',
            'sm': '4px',
            'md': '12px',
            'lg': '20px',
            'full': '999px'
        };
        setVar('--radius-theme', radiusMap[theme.radius]);
    }
};
