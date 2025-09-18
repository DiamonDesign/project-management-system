import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Production optimizations
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false, // Disable in production for security
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          // FIXED: Keep Supabase core and auth UI together to prevent initialization issues
          'supabase-core': ['@supabase/supabase-js'],
          'supabase-auth-ui': ['@supabase/auth-ui-react', '@supabase/auth-ui-shared'],
          utils: ['date-fns', 'clsx', 'tailwind-merge', 'lucide-react'],
          charts: ['recharts'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          query: ['@tanstack/react-query'],
        },
        // Use contenthash for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
  },

  // Security headers for development server
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Environment variable handling
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Performance optimizations - FIXED: Preserve Supabase console statements
  esbuild: {
    drop: ['debugger'], // Only remove debugger statements
    pure: ['console.log', 'console.info'], // Only remove non-critical console methods
    // CRITICAL: Do not drop 'console' entirely as Supabase relies on console.error internally
  },

  // CSS optimization
  css: {
    devSourcemap: false,
  },
});