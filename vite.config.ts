import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '/Vaultly/',
    server: {
        strictPort: true,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('recharts') || id.includes('d3')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('jspdf')) {
                            return 'vendor-pdf';
                        }
                        if (id.includes('framer-motion')) {
                            return 'vendor-animation';
                        }
                    }
                }
            }
        }
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            workbox: {
                maximumFileSizeToCacheInBytes: 4000000
            },
            manifest: {
                name: 'Vaultly',
                short_name: 'Vaultly',
                description: 'Personal Finance Vault',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                    {
                        src: 'favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        }),
    ],
})
