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
                    450: 'color-mix(in srgb, var(--color-app-400) 50%, var(--color-app-500) 50%)',
                    455: 'color-mix(in srgb, var(--color-app-400) 45%, var(--color-app-500) 55%)',
                    500: 'var(--color-app-500)',
                    600: 'var(--color-app-600)',
                    650: 'color-mix(in srgb, var(--color-app-600) 50%, var(--color-app-700) 50%)',
                    700: 'var(--color-app-700)',
                    800: 'var(--color-app-800)',
                    850: 'color-mix(in srgb, var(--color-app-800) 50%, var(--color-app-900) 50%)',
                    900: 'var(--color-app-900)',
                    950: 'var(--color-app-950)',
                    955: 'color-mix(in srgb, var(--color-app-950) 80%, black 20%)',
                },
                gray: {
                    50: 'var(--color-app-50)',
                    100: 'var(--color-app-100)',
                    200: 'var(--color-app-200)',
                    300: 'var(--color-app-300)',
                    400: 'var(--color-app-400)',
                    450: 'color-mix(in srgb, var(--color-app-400) 50%, var(--color-app-500) 50%)',
                    455: 'color-mix(in srgb, var(--color-app-400) 45%, var(--color-app-500) 55%)',
                    500: 'var(--color-app-500)',
                    600: 'var(--color-app-600)',
                    650: 'color-mix(in srgb, var(--color-app-600) 50%, var(--color-app-700) 50%)',
                    700: 'var(--color-app-700)',
                    800: 'var(--color-app-800)',
                    850: 'color-mix(in srgb, var(--color-app-800) 50%, var(--color-app-900) 50%)',
                    900: 'var(--color-app-900)',
                    950: 'var(--color-app-950)',
                    955: 'color-mix(in srgb, var(--color-app-950) 80%, black 20%)',
                },
                emerald: {
                    450: 'color-mix(in srgb, #34d399 50%, #10b981 50%)',
                },
                sky: {
                    450: 'color-mix(in srgb, #38bdf8 50%, #0ea5e9 50%)',
                },
                rose: {
                    450: 'color-mix(in srgb, #fb7185 50%, #f43f5e 50%)',
                }
            },
            borderRadius: {
                // Dynamic Radius System
                'none': '0',
                'sm': 'calc(var(--radius-theme) * 0.5)',
                DEFAULT: 'var(--radius-theme)',
                'md': 'var(--radius-theme)',
                'lg': 'calc(var(--radius-theme) * 1.25)',
                'xl': 'calc(var(--radius-theme) * 1.5)',
                '2xl': 'calc(var(--radius-theme) * 1.75)',
                '3xl': 'calc(var(--radius-theme) * 2.0)',
                'full': '9999px',
            }
        },
    },
    plugins: [],
}
