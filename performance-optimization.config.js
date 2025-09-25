/**
 * Advanced Performance Optimization Configuration
 * Comprehensive build-time and runtime performance optimizations
 * Integrates with CDN and edge computing strategies
 */

import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// Performance optimization configuration
export const performanceConfig = defineConfig({
  // Build optimizations
  build: {
    // Target modern browsers for better optimization
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],

    // Minimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // More aggressive optimizations
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        hoist_funs: true,
        hoist_vars: true
      },
      mangle: {
        safari10: true,
        // Mangle property names for smaller bundles
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    },

    // Advanced chunk splitting strategy
    rollupOptions: {
      output: {
        // Optimal chunk splitting for caching
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            // Utility libraries
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind')) {
              return 'utils-vendor';
            }
            // Charts and visualization
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            // Authentication and API
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'api-vendor';
            }
            // Other vendors
            return 'vendor';
          }

          // Application code splitting
          if (id.includes('/src/pages/')) {
            const page = id.split('/src/pages/')[1].split('/')[0];
            return `page-${page}`;
          }

          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }

          if (id.includes('/src/components/')) {
            return 'components';
          }

          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }

          if (id.includes('/src/lib/')) {
            return 'lib';
          }
        },

        // Optimize chunk file names for caching
        chunkFileNames: (chunkInfo) => {
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `assets/fonts/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        }
      },

      // External dependencies (loaded from CDN)
      external: (id) => {
        // Load React from CDN in production
        if (process.env.NODE_ENV === 'production' && process.env.USE_CDN === 'true') {
          return ['react', 'react-dom'].includes(id);
        }
        return false;
      }
    },

    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,

    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,

    // Asset optimization
    assetsInlineLimit: 4096, // 4KB threshold for inlining
    assetsDir: 'assets',

    // Report compressed file sizes
    reportCompressedSize: true,

    // Chunk size warning limit
    chunkSizeWarningLimit: 800
  },

  // Development server optimizations
  server: {
    // HTTP/2 for better multiplexing
    https: process.env.VITE_HTTPS === 'true',

    // Preload optimization
    warmup: {
      clientFiles: [
        './src/pages/**/*.tsx',
        './src/components/**/*.tsx',
        './src/lib/**/*.ts'
      ]
    }
  },

  // Dependency optimization
  optimizeDeps: {
    // Include dependencies for pre-bundling
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react'
    ],

    // Exclude from pre-bundling (load on-demand)
    exclude: [
      'recharts',
      '@tiptap/react',
      '@use-gesture/react'
    ]
  }
});

// Plugin configurations
export const performancePlugins = [
  // Bundle analyzer
  visualizer({
    filename: 'dist/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap'
  }),

  // Compression plugins
  compression({
    algorithm: 'gzip',
    ext: '.gz',
    deleteOriginFile: false,
    threshold: 1024, // Only compress files larger than 1KB
    compressionOptions: { level: 9 }
  }),

  compression({
    algorithm: 'brotliCompress',
    ext: '.br',
    deleteOriginFile: false,
    threshold: 1024,
    compressionOptions: {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11
      }
    }
  }),

  // Progressive Web App
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      // Advanced caching strategies
      globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,woff2}'],

      // Runtime caching
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 1 month
            }
          }
        }
      ],

      // Skip waiting for immediate updates
      skipWaiting: true,
      clientsClaim: true
    },

    // Manifest configuration
    manifest: {
      name: 'VisionDay',
      short_name: 'VisionDay',
      description: 'Project Management and Client Portal Platform',
      theme_color: '#000000',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  })
];

// Resource hints and preload configuration
export const resourceHints = {
  // DNS prefetch for external domains
  dnsPrefetch: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net',
    'https://api.supabase.io'
  ],

  // Preconnect to critical domains
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],

  // Module preload for critical routes
  modulePreload: [
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/pages/Dashboard.tsx'
  ],

  // Prefetch for likely next routes
  prefetch: [
    '/src/pages/Projects.tsx',
    '/src/pages/Tasks.tsx',
    '/src/pages/Clients.tsx'
  ]
};

// Image optimization configuration
export const imageOptimization = {
  // Supported formats
  formats: ['webp', 'avif', 'png', 'jpg'],

  // Quality settings
  quality: {
    webp: 85,
    avif: 85,
    jpg: 85,
    png: 90
  },

  // Responsive image sizes
  sizes: [320, 640, 768, 1024, 1280, 1600, 1920],

  // Lazy loading configuration
  lazyLoading: {
    threshold: 0.1, // Load when 10% visible
    rootMargin: '50px'
  },

  // Critical image preload
  criticalImages: [
    '/images/logo.png',
    '/images/hero-bg.jpg'
  ]
};

// Font optimization configuration
export const fontOptimization = {
  // Preload critical fonts
  preload: [
    {
      href: '/fonts/inter-var.woff2',
      as: 'font',
      type: 'font/woff2',
      crossorigin: 'anonymous'
    }
  ],

  // Font display strategy
  fontDisplay: 'swap',

  // Subset configuration
  subsets: ['latin', 'latin-ext'],

  // Variable font support
  variableFonts: true
};

// Critical CSS configuration
export const criticalCSS = {
  // Inline critical CSS for above-the-fold content
  inline: true,

  // Critical CSS dimensions
  dimensions: [
    { width: 1300, height: 900 }, // Desktop
    { width: 768, height: 1024 }, // Tablet
    { width: 375, height: 667 }   // Mobile
  ],

  // Critical routes
  routes: [
    '/',
    '/dashboard',
    '/login'
  ]
};

// Performance budget configuration
export const performanceBudget = {
  // Bundle size limits
  bundles: {
    'main.js': { maxSize: '250kb' },
    'vendor.js': { maxSize: '500kb' },
    'styles.css': { maxSize: '50kb' }
  },

  // Resource counts
  resources: {
    scripts: 20,
    stylesheets: 10,
    images: 50,
    fonts: 5
  },

  // Network metrics
  metrics: {
    firstContentfulPaint: 1800,
    largestContentfulPaint: 2500,
    firstInputDelay: 100,
    cumulativeLayoutShift: 0.1,
    totalBlockingTime: 300
  }
};

// CDN configuration
export const cdnConfig = {
  // Primary CDN (CloudFront/CloudFlare)
  primary: {
    domain: 'cdn.visionday.app',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],

    // Cache policies
    cacheRules: [
      {
        pathPattern: '*.js',
        ttl: 31536000, // 1 year
        behavior: 'immutable'
      },
      {
        pathPattern: '*.css',
        ttl: 31536000, // 1 year
        behavior: 'immutable'
      },
      {
        pathPattern: '*.{png,jpg,jpeg,gif,svg,webp}',
        ttl: 86400, // 1 day
        behavior: 'public'
      },
      {
        pathPattern: '*.{woff,woff2,eot,ttf}',
        ttl: 31536000, // 1 year
        behavior: 'immutable'
      },
      {
        pathPattern: '/',
        ttl: 3600, // 1 hour
        behavior: 'public'
      }
    ]
  },

  // Fallback CDN
  fallback: {
    domain: 'cdn2.visionday.app',
    regions: ['us-west-2', 'eu-central-1', 'ap-northeast-1']
  },

  // Edge functions
  edgeFunctions: [
    {
      name: 'image-optimization',
      path: '/images/*',
      function: 'optimizeImages'
    },
    {
      name: 'redirect-rules',
      path: '/*',
      function: 'handleRedirects'
    },
    {
      name: 'security-headers',
      path: '/*',
      function: 'addSecurityHeaders'
    }
  ]
};

export default {
  performanceConfig,
  performancePlugins,
  resourceHints,
  imageOptimization,
  fontOptimization,
  criticalCSS,
  performanceBudget,
  cdnConfig
};