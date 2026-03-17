import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // App lives at /app/ — landing page stays at /
  base: '/app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Ijma Wallet',
        short_name: 'Ijma',
        description: 'Sovereign Bitcoin · Lightning · Nostr · Ecash Wallet',
        theme_color: '#F7931A',
        background_color: '#0A0A0F',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/app/',
        start_url: '/app/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache strategies for offline support
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'price-cache',
              expiration: { maxAgeSeconds: 60 }
            }
          },
          {
            urlPattern: /^https:\/\/mempool\.space\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'mempool-cache' }
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    // Enable source maps for debugging (disable in prod for security)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Chunk splitting for performance
        manualChunks: {
          'nostr': ['nostr-tools', '@nostr-dev-kit/ndk'],
          'bitcoin': ['bitcoinjs-lib', '@scure/bip32', '@scure/bip39'],
          'cashu': ['@cashu/cashu-ts'],
        }
      }
    }
  },
  // Required for tiny-secp256k1 / WebAssembly
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  }
})
