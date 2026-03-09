/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                zinc: {
                    50: 'var(--color-app-50)',
                    100: 'var(--color-app-100)',
                    200: 'var(--color-app-200)',
                    300: 'var(--color-app-300)',
                    400: 'var(--color-app-400)',
                    500: 'var(--color-app-500)',
                    600: 'var(--color-app-600)',
                    700: 'var(--color-app-700)',
                    800: 'var(--color-app-800)',
                    900: 'var(--color-app-900)',
                    950: 'var(--color-app-950)',
                },
                gray: {
                    50: 'var(--color-app-50)',
                    100: 'var(--color-app-100)',
                    200: 'var(--color-app-200)',
                    300: 'var(--color-app-300)',
                    400: 'var(--color-app-400)',
                    500: 'var(--color-app-500)',
                    600: 'var(--color-app-600)',
                    700: 'var(--color-app-700)',
                    800: 'var(--color-app-800)',
                    900: 'var(--color-app-900)',
                    950: 'var(--color-app-950)',
                }
            },
            borderRadius: {
                // Dynamic Radius System
                'none': '0',
                'sm': 'calc(var(--radius-theme) * 0.5)',
                DEFAULT: 'var(--radius-theme)',
                'md': 'var(--radius-theme)',
                'lg': 'calc(var(--radius-theme) * 1.5)',
                'xl': 'calc(var(--radius-theme) * 2.0)',
                '2xl': 'calc(var(--radius-theme) * 2.5)',
                '3xl': 'calc(var(--radius-theme) * 3.0)',
                'full': '9999px',
            }
        },
    },
    plugins: [],
}
