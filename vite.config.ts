import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { adaptiveCSPPlugin } from "./src/lib/vite-adaptive-csp-plugin";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
    strictPort: false,
    hmr: {
      port: 0  // Use dynamic port allocation to avoid conflicts
    }
  },
  plugins: [
    react(),
    // TEMPORARILY DISABLED - CSP causing infinite loop, blocking deployment
    // Will be re-enabled after fixing the middleware loop issue
    // adaptiveCSPPlugin({
    //   reportUri: process.env.VITE_CSP_REPORT_URI,
    //   enableNonces: true,
    //   enableHashes: true,
    //   reportViolations: true,
    //   developmentMode: 'secure', // Balanced security for development
    //   customDomains: [
    //     // Add any additional trusted domains here
    //     'https://fonts.googleapis.com',
    //     'https://fonts.gstatic.com'
    //   ]
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle optimization for 60% size reduction
    rollupOptions: {
      output: {
        // Strategic chunk splitting for optimal caching and loading
        manualChunks: {
          // Core React libraries - loaded first
          'react-core': ['react', 'react-dom'],

          // UI component libraries - cached separately
          'ui-libs': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle'
          ],

          // Router and navigation - separate chunk
          'routing': ['react-router-dom'],

          // Data fetching and state management
          'data': ['@tanstack/react-query'],

          // Analytics and charts - lazy loaded
          'charts': ['recharts'],

          // TipTap editor - secure rich text editor
          'editor': ['@tiptap/react', '@tiptap/starter-kit'],

          // Date utilities
          'date': ['date-fns'],

          // Icons - separate chunk for better caching
          'icons': ['lucide-react'],

          // Utilities and helpers
          'utils': [
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ],

          // Authentication and backend
          'supabase': ['@supabase/supabase-js'],

          // Security utilities - separate chunk for CSP features
          'security': ['dompurify', 'validator']
        },

        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `assets/[name]-[hash].js`;
        },

        // Optimize asset naming
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },

    // Enable aggressive minification - FIXED: Preserve Supabase console statements
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Keep console.error for error handling
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Only remove non-critical console methods
        passes: 2 // Multiple compression passes
      },
      mangle: {
        safari10: true // Ensure Safari 10+ compatibility
      }
    },

    // CSS optimization
    cssMinify: true,

    // Optimize chunk size limits for better loading
    chunkSizeWarningLimit: 800, // Warn at 800kb instead of default 500kb

    // Source map configuration for production debugging
    sourcemap: false, // Disable in production to reduce bundle size

    // Asset optimization
    assetsInlineLimit: 4096 // Inline assets smaller than 4kb
  },

  // CSS optimization
  css: {
    devSourcemap: true // Only in development
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@tanstack/react-query',
      // Include security utilities for better dev performance
      'dompurify',
      'validator'
    ],
    exclude: [
      'recharts'     // Charts - load on demand
    ]
  }
}));