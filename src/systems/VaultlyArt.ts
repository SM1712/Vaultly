export type ThemeMode = 'light' | 'dark';
export type ThemeRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ThemeTexture = 'none' | 'noise' | 'glass' | 'dots' | 'grid' | 'stripes' | 'wave';
export type ThemeTextureTarget = 'bg' | 'card' | 'both';
export type ThemeBorderStyle = 'clean' | 'contrast' | 'shadow' | 'brutalist';
export type ThemeShadowStyle = 'none' | 'soft' | 'glow' | 'brutalist';
export type ThemeFontFamily = 'outfit' | 'inter' | 'serif' | 'mono' | 'syne';
export type ThemeLetterSpacing = 'tight' | 'normal' | 'wide';
export type ThemeCommaStyle = 'standard' | 'curly' | 'monospaced' | 'accented';
export type ThemeAccentGlow = 'none' | 'aurora' | 'cyberpunk' | 'warm-sunset' | 'retro-green';
export type ThemeBgType = 'solid' | 'gradient' | 'mesh';

export interface VaultlyArtThemeConfig {
    id: string;
    name: string;
    description: string;
    type: ThemeMode;

    // Color Engine
    hue: number;
    saturation: number;
    primaryColor: string; // hex base code
    accentGlow: ThemeAccentGlow;

    // Materials & Surfaces
    bgType: ThemeBgType;
    texture: ThemeTexture;
    textureTarget: ThemeTextureTarget;
    textureIntensity: number; // 0-100
    glassBlur: number; // px blur
    glassOpacity: number; // 0-100

    // Borders & Shadows
    radius: ThemeRadius;
    borderStyle: ThemeBorderStyle;
    borderThickness: number; // 0-3px
    shadowStyle: ThemeShadowStyle;

    // Typography & Punctuation
    fontFamily: ThemeFontFamily;
    letterSpacing: ThemeLetterSpacing;
    commaStyle: ThemeCommaStyle;
}

export const PRESET_THEMES: VaultlyArtThemeConfig[] = [
    {
        id: 'neolux',
        name: 'Neo-Lux Aurora',
        description: 'La firma premium de Vaultly. Minimalismo de cristal templado, fuentes modernas y auroras danzantes.',
        type: 'dark',
        hue: 250,
        saturation: 85,
        primaryColor: '#6366f1',
        accentGlow: 'aurora',
        bgType: 'mesh',
        texture: 'glass',
        textureTarget: 'both',
        textureIntensity: 25,
        glassBlur: 16,
        glassOpacity: 70,
        radius: 'lg',
        borderStyle: 'clean',
        borderThickness: 1,
        shadowStyle: 'glow',
        fontFamily: 'outfit',
        letterSpacing: 'normal',
        commaStyle: 'standard'
    },
    {
        id: 'classic',
        name: 'Soft Stone',
        description: 'Una base limpia y sobria para enfocar la mente. Texturas mate, alto contraste táctil y tipografía sans-serif.',
        type: 'light',
        hue: 30,
        saturation: 8,
        primaryColor: '#78716c',
        accentGlow: 'none',
        bgType: 'solid',
        texture: 'none',
        textureTarget: 'bg',
        textureIntensity: 0,
        glassBlur: 0,
        glassOpacity: 100,
        radius: 'md',
        borderStyle: 'contrast',
        borderThickness: 1,
        shadowStyle: 'soft',
        fontFamily: 'inter',
        letterSpacing: 'normal',
        commaStyle: 'standard'
    },
    {
        id: 'brutalist',
        name: 'Brutalist Retro',
        description: 'El encanto de los fanzines impresos y las terminales vintage. Bordes negros gruesos, esquinas rectas y sombras duras sólidas.',
        type: 'light',
        hue: 45,
        saturation: 95,
        primaryColor: '#eab308',
        accentGlow: 'none',
        bgType: 'solid',
        texture: 'grid',
        textureTarget: 'both',
        textureIntensity: 35,
        glassBlur: 0,
        glassOpacity: 100,
        radius: 'none',
        borderStyle: 'brutalist',
        borderThickness: 3,
        shadowStyle: 'brutalist',
        fontFamily: 'mono',
        letterSpacing: 'tight',
        commaStyle: 'monospaced'
    },
    {
        id: 'glassneon',
        name: 'Glass Neon',
        description: 'Inmersión nocturna de alta fidelidad. Tarjetas de cristal hiper-lúcido flotando sobre un destello violeta-fucsia.',
        type: 'dark',
        hue: 320,
        saturation: 90,
        primaryColor: '#ec4899',
        accentGlow: 'cyberpunk',
        bgType: 'gradient',
        texture: 'glass',
        textureTarget: 'card',
        textureIntensity: 40,
        glassBlur: 20,
        glassOpacity: 55,
        radius: 'xl',
        borderStyle: 'clean',
        borderThickness: 1,
        shadowStyle: 'glow',
        fontFamily: 'syne',
        letterSpacing: 'wide',
        commaStyle: 'accented'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk Grid',
        description: 'Directo de la red central. Matrices de líneas, tipografía técnica, tonos amarillos y cianes sobre fondo negro puro.',
        type: 'dark',
        hue: 180,
        saturation: 95,
        primaryColor: '#06b6d4',
        accentGlow: 'cyberpunk',
        bgType: 'mesh',
        texture: 'grid',
        textureTarget: 'bg',
        textureIntensity: 30,
        glassBlur: 0,
        glassOpacity: 100,
        radius: 'none',
        borderStyle: 'contrast',
        borderThickness: 1.5,
        shadowStyle: 'glow',
        fontFamily: 'mono',
        letterSpacing: 'normal',
        commaStyle: 'monospaced'
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        description: 'Sereno, profundo y profesional. Gradientes inspirados en el mar nórdico con tarjetas transparentes y fuentes fluidas.',
        type: 'light',
        hue: 200,
        saturation: 85,
        primaryColor: '#0ea5e9',
        accentGlow: 'none',
        bgType: 'gradient',
        texture: 'glass',
        textureTarget: 'both',
        textureIntensity: 15,
        glassBlur: 10,
        glassOpacity: 80,
        radius: 'md',
        borderStyle: 'clean',
        borderThickness: 1,
        shadowStyle: 'soft',
        fontFamily: 'inter',
        letterSpacing: 'normal',
        commaStyle: 'standard'
    },
    {
        id: 'sunset',
        name: 'Sunset Glow',
        description: 'Cálido y acogedor como un atardecer. Texturas con grano vintage, bordes suaves y espaciados amplios y cómodos.',
        type: 'light',
        hue: 22,
        saturation: 90,
        primaryColor: '#f97316',
        accentGlow: 'warm-sunset',
        bgType: 'gradient',
        texture: 'noise',
        textureTarget: 'both',
        textureIntensity: 20,
        glassBlur: 8,
        glassOpacity: 90,
        radius: 'lg',
        borderStyle: 'clean',
        borderThickness: 1,
        shadowStyle: 'soft',
        fontFamily: 'outfit',
        letterSpacing: 'normal',
        commaStyle: 'curly'
    },
    {
        id: 'royal',
        name: 'Royal Velvet',
        description: 'El lujo reside en los detalles. Contraste profundo de color índigo y oro, tipografía serif editorial y bordes finos.',
        type: 'dark',
        hue: 265,
        saturation: 75,
        primaryColor: '#fbbf24', // Gold Accent
        accentGlow: 'aurora',
        bgType: 'mesh',
        texture: 'glass',
        textureTarget: 'card',
        textureIntensity: 15,
        glassBlur: 24,
        glassOpacity: 75,
        radius: 'lg',
        borderStyle: 'clean',
        borderThickness: 0.75,
        shadowStyle: 'glow',
        fontFamily: 'serif',
        letterSpacing: 'normal',
        commaStyle: 'curly'
    },
    {
        id: 'forest',
        name: 'Forest Rain',
        description: 'La calma de la naturaleza en tu pantalla. Un patrón sutil de gotas (puntos), colores de bosque lluvioso y bordes amigables.',
        type: 'light',
        hue: 142,
        saturation: 70,
        primaryColor: '#10b981',
        accentGlow: 'none',
        bgType: 'solid',
        texture: 'dots',
        textureTarget: 'both',
        textureIntensity: 25,
        glassBlur: 0,
        glassOpacity: 100,
        radius: 'full',
        borderStyle: 'clean',
        borderThickness: 1,
        shadowStyle: 'soft',
        fontFamily: 'outfit',
        letterSpacing: 'normal',
        commaStyle: 'standard'
    }
];

export const VaultlyArt = {
    getAllThemes: () => PRESET_THEMES,

    getTheme: (id: string): VaultlyArtThemeConfig => {
        return PRESET_THEMES.find(t => t.id === id) || PRESET_THEMES[0];
    },

    applyTheme: (themeId: string, mode: ThemeMode = 'light') => {
        const theme = PRESET_THEMES.find(t => t.id === themeId) || PRESET_THEMES[0];
        VaultlyArt.applyCustomTheme(theme, mode);
    },

    applyCustomTheme: (config: Omit<VaultlyArtThemeConfig, 'id' | 'name' | 'description' | 'type' | 'primaryColor'>, mode: ThemeMode) => {
        const root = document.documentElement;

        // 1. Core Metadata
        root.setAttribute('data-radius', config.radius);
        root.setAttribute('data-texture', config.texture);
        root.setAttribute('data-texture-target', config.textureTarget);
        root.setAttribute('data-border-style', config.borderStyle);
        root.setAttribute('data-shadow-style', config.shadowStyle);
        root.setAttribute('data-font-family', config.fontFamily);
        root.setAttribute('data-letter-spacing', config.letterSpacing);
        root.setAttribute('data-comma-style', config.commaStyle);
        root.setAttribute('data-accent-glow', config.accentGlow);
        root.setAttribute('data-bg-type', config.bgType);

        // 2. Set Raw CSS variables
        const setVar = (name: string, value: string) => {
            root.style.setProperty(name, value);
        };

        // Primary base color
        const baseHue = config.hue;
        const baseSat = config.saturation;
        setVar('--color-primary', `hsl(${baseHue}, ${baseSat}%, 50%)`);
        setVar('--color-primary-glow', `hsl(${baseHue}, ${baseSat}%, 50%, 0.15)`);

        // Texture Intensity & Blur
        setVar('--texture-intensity', (config.textureIntensity / 100).toString());
        setVar('--glass-blur', `${config.glassBlur}px`);
        setVar('--glass-opacity', (config.glassOpacity / 100).toString());
        setVar('--border-thickness', `${config.borderThickness}px`);

        // Spacing/Radius mapping
        const radiusMap: Record<ThemeRadius, string> = {
            'none': '0px',
            'sm': '6px',
            'md': '10px',
            'lg': '16px',
            'xl': '24px',
            'full': '9999px'
        };
        setVar('--radius-theme', radiusMap[config.radius]);

        // 3. Typographical Comma Art mapping variables
        // standard | curly | monospaced | accented
        if (config.commaStyle === 'accented') {
            setVar('--comma-color', `hsl(${baseHue}, ${baseSat}%, 50%)`);
            setVar('--comma-font', 'inherit');
            setVar('--comma-weight', '900');
            setVar('--comma-size', '1.1em');
            setVar('--comma-transform', 'scale(1.2) translateY(-1px)');
        } else if (config.commaStyle === 'curly') {
            setVar('--comma-color', 'inherit');
            setVar('--comma-font', '"Playfair Display", Georgia, serif');
            setVar('--comma-weight', 'bold');
            setVar('--comma-size', '1.3em');
            setVar('--comma-transform', 'translateY(1px)');
        } else if (config.commaStyle === 'monospaced') {
            setVar('--comma-color', `hsl(${baseHue}, ${baseSat}%, 40%)`);
            setVar('--comma-font', '"Space Mono", Courier, monospace');
            setVar('--comma-weight', '900');
            setVar('--comma-size', '1em');
            setVar('--comma-transform', 'translateX(1px)');
        } else {
            // standard
            setVar('--comma-color', 'inherit');
            setVar('--comma-font', 'inherit');
            setVar('--comma-weight', 'inherit');
            setVar('--comma-size', 'inherit');
            setVar('--comma-transform', 'none');
        }

        // 4. Color Palette Generation
        if (mode === 'dark') {
            // High-fidelity dark mode palette tinted with the theme base hue
            // We use CSS color-mix to mix neutral charcoal with the primary hue for a premium, sleek tone
            setVar('--color-app-50', '#f8fafc'); // Light text
            setVar('--color-app-100', '#f1f5f9');
            setVar('--color-app-200', '#e2e8f0');
            setVar('--color-app-300', '#cbd5e1');
            setVar('--color-app-400', '#94a3b8');
            setVar('--color-app-500', '#64748b');
            setVar('--color-app-600', '#475569');
            setVar('--color-app-700', '#334155');

            // Rich tinted backgrounds
            setVar('--color-app-800', `color-mix(in srgb, #121216, hsl(${baseHue}, ${baseSat}%, 20%) 5%)`); // Cards background
            setVar('--color-app-900', `color-mix(in srgb, #08080a, hsl(${baseHue}, ${baseSat}%, 15%) 6%)`); // Sidebars/Header
            setVar('--color-app-950', `color-mix(in srgb, #020204, hsl(${baseHue}, ${baseSat}%, 10%) 4%)`); // App Body Base
        } else {
            // Light Mode Palette
            // Generate full spectrum of light tints for the background base
            const lightnessMap: Record<number, number> = {
                50: 98, 100: 95, 200: 90, 300: 82, 400: 64,
                500: 50, 600: 40, 700: 30, 800: 20, 900: 12, 950: 6
            };
            Object.entries(lightnessMap).forEach(([stop, l]) => {
                setVar(`--color-app-${stop}`, `hsl(${baseHue}, ${baseSat}%, ${l}%)`);
            });
        }
    }
};
