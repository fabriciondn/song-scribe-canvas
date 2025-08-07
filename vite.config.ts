import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Compuse - Compositor Musical',
        short_name: 'Compuse',
        description: 'Aplicativo completo para composição musical, criação de cifras e colaboração em tempo real.',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/dashboard',
        categories: ['music', 'productivity', 'entertainment'],
        icons: [
          {
            src: '/lovable-uploads/4c99f507-bfdd-40d3-905a-dfe8af213cb3.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/lovable-uploads/4c99f507-bfdd-40d3-905a-dfe8af213cb3.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/lovable-uploads/4c99f507-bfdd-40d3-905a-dfe8af213cb3.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          },
          {
            src: '/lovable-uploads/4c99f507-bfdd-40d3-905a-dfe8af213cb3.png',
            sizes: '152x152',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: mode === 'development',
        type: 'module'
      }
    })
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          icons: ['lucide-react'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          recharts: ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
