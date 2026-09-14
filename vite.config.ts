import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'framer-motion',
      'lucide-react',
      'react-hook-form',
      'zod',
      'date-fns',
      'sonner',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
    exclude: ['three', 'three-globe'],
    esbuildOptions: {
      target: 'esnext',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: ['chrome90', 'firefox90', 'safari15', 'edge90'],
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'vendor-three'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts'
          if (id.includes('node_modules/framer-motion')) return 'vendor-framer'
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          if (id.includes('node_modules/@tanstack')) return 'vendor-query'
          if (id.includes('node_modules/react-router-dom')) return 'vendor-router'
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/date-fns')) return 'vendor-date'
          if (id.includes('node_modules/zod')) return 'vendor-zod'
          if (id.includes('node_modules/react-hook-form')) return 'vendor-forms'
          if (id.includes('node_modules/sonner') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge') || id.includes('node_modules/class-variance-authority')) return 'vendor-utils'
        },
      },
    },
    modulePreload: {
      polyfill: true,
    },
  },

  server: {
    port: 5001,
    host: '0.0.0.0',
    allowedHosts: true,
    open: false,
    cors: true,
    strictPort: false,
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/HomePage.tsx',
        './src/components/hero.tsx',
        './src/components/site-header.tsx',
        './src/components/AdminLayout.tsx',
        './src/components/dashboard/DashboardShell.tsx',
        './src/pages/AdminDashboard.tsx',
        './src/pages/admin/*.tsx',
        './src/pages/DashboardPage.tsx',
        './src/pages/ProfilePage.tsx',
      ],
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/*.md', '**/*.log', '**/.*'],
    },
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false,
      allow: ['..'],
    },
  },

  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
})
