/**
 * Cloudflare Edge Worker for Advanced Performance Optimization
 * Handles image optimization, caching, security headers, and dynamic content
 */

// Configuration constants
const CONFIG = {
  // Image optimization settings
  images: {
    quality: 85,
    formats: ['webp', 'avif'],
    sizes: [320, 640, 768, 1024, 1280, 1600],
    maxAge: 86400 * 30, // 30 days
  },

  // Cache settings
  cache: {
    static: 86400 * 365, // 1 year for static assets
    dynamic: 3600,       // 1 hour for dynamic content
    api: 300,            // 5 minutes for API responses
  },

  // Security headers
  security: {
    hsts: 'max-age=31536000; includeSubDomains; preload',
    csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }
};

// Main request handler
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Route to specific handlers based on path
      if (url.pathname.startsWith('/images/')) {
        return handleImageOptimization(request, env, ctx);
      } else if (url.pathname.startsWith('/api/')) {
        return handleAPIProxy(request, env, ctx);
      } else if (url.pathname.match(/\.(js|css|woff2?|ico)$/)) {
        return handleStaticAssets(request, env, ctx);
      } else {
        return handlePageRequest(request, env, ctx);
      }

    } catch (error) {
      console.error('Edge worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: getSecurityHeaders()
      });
    }
  }
};

/**
 * Handle image optimization and transformation
 */
async function handleImageOptimization(request, env, ctx) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Parse image parameters from query string
  const params = {
    width: parseInt(url.searchParams.get('w') || '0'),
    height: parseInt(url.searchParams.get('h') || '0'),
    quality: parseInt(url.searchParams.get('q') || '85'),
    format: url.searchParams.get('f') || 'auto',
    fit: url.searchParams.get('fit') || 'cover'
  };

  // Create cache key
  const cacheKey = `image:${url.pathname}:${JSON.stringify(params)}`;

  // Check cache first
  let response = await cache.match(cacheKey);
  if (response) {
    return addPerformanceHeaders(response, 'HIT');
  }

  try {
    // Fetch original image
    const originResponse = await fetch(request.url, {
      headers: {
        'User-Agent': 'VisionDay-EdgeWorker/1.0'
      }
    });

    if (!originResponse.ok) {
      return new Response('Image not found', { status: 404 });
    }

    // Determine output format
    const acceptHeader = request.headers.get('accept') || '';
    let outputFormat = params.format;

    if (outputFormat === 'auto') {
      if (acceptHeader.includes('image/avif')) {
        outputFormat = 'avif';
      } else if (acceptHeader.includes('image/webp')) {
        outputFormat = 'webp';
      } else {
        outputFormat = 'jpeg';
      }
    }

    // Apply Cloudflare Image Resizing
    const resizeOptions = {
      width: params.width || undefined,
      height: params.height || undefined,
      quality: Math.min(params.quality, 95),
      format: outputFormat,
      fit: params.fit,
      sharpen: 1.0,
      // Enable progressive JPEG
      progressive: outputFormat === 'jpeg'
    };

    // Use Cloudflare Images API for transformation
    const transformedImage = await fetch(originResponse.url, {
      cf: {
        image: resizeOptions
      }
    });

    if (!transformedImage.ok) {
      return originResponse;
    }

    // Create optimized response
    response = new Response(transformedImage.body, {
      status: 200,
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Cache-Control': `public, max-age=${CONFIG.cache.static}, immutable`,
        'Vary': 'Accept',
        'X-Image-Optimized': '1',
        'X-Original-Format': originResponse.headers.get('content-type') || 'unknown',
        'X-Output-Format': outputFormat,
        ...getSecurityHeaders()
      }
    });

    // Cache the optimized image
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return addPerformanceHeaders(response, 'MISS');

  } catch (error) {
    console.error('Image optimization error:', error);
    // Fallback to original image
    return fetch(request);
  }
}

/**
 * Handle static asset optimization
 */
async function handleStaticAssets(request, env, ctx) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Check cache first
  let response = await cache.match(request);
  if (response) {
    return addPerformanceHeaders(response, 'HIT');
  }

  // Fetch from origin
  response = await fetch(request, {
    headers: {
      'User-Agent': 'VisionDay-EdgeWorker/1.0'
    }
  });

  if (!response.ok) {
    return response;
  }

  // Clone response for modification
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'Cache-Control': `public, max-age=${CONFIG.cache.static}, immutable`,
      'X-Static-Asset': '1',
      ...getSecurityHeaders()
    }
  });

  // Add compression if not already compressed
  const contentEncoding = response.headers.get('content-encoding');
  if (!contentEncoding && shouldCompress(url.pathname)) {
    // Cloudflare automatically handles compression for supported content types
    modifiedResponse.headers.set('Vary', 'Accept-Encoding');
  }

  // Cache the response
  ctx.waitUntil(cache.put(request, modifiedResponse.clone()));

  return addPerformanceHeaders(modifiedResponse, 'MISS');
}

/**
 * Handle API proxy with caching and optimization
 */
async function handleAPIProxy(request, env, ctx) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Create cache key (only for GET requests)
  const cacheKey = request.method === 'GET' ? `api:${url.pathname}:${url.search}` : null;

  // Check cache for GET requests
  if (cacheKey) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return addPerformanceHeaders(cachedResponse, 'HIT');
    }
  }

  try {
    // Forward to origin API
    const apiResponse = await fetch(request, {
      headers: {
        ...Object.fromEntries(request.headers),
        'User-Agent': 'VisionDay-EdgeWorker/1.0',
        'X-Forwarded-For': request.headers.get('cf-connecting-ip') || '',
      }
    });

    if (!apiResponse.ok) {
      return apiResponse;
    }

    // Add appropriate headers
    const headers = {
      ...Object.fromEntries(apiResponse.headers),
      'X-API-Cached': cacheKey ? 'MISS' : 'UNCACHEABLE',
      ...getSecurityHeaders()
    };

    // Add caching for GET requests with successful responses
    if (cacheKey && apiResponse.status === 200) {
      headers['Cache-Control'] = `public, max-age=${CONFIG.cache.api}`;
    } else {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    const modifiedResponse = new Response(apiResponse.body, {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers
    });

    // Cache successful GET responses
    if (cacheKey && apiResponse.status === 200) {
      ctx.waitUntil(cache.put(cacheKey, modifiedResponse.clone()));
    }

    return addPerformanceHeaders(modifiedResponse, cacheKey ? 'MISS' : 'BYPASS');

  } catch (error) {
    console.error('API proxy error:', error);
    return new Response('API Gateway Error', {
      status: 502,
      headers: getSecurityHeaders()
    });
  }
}

/**
 * Handle page requests with optimizations
 */
async function handlePageRequest(request, env, ctx) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Check for A/B testing headers
  const abTestVariant = request.headers.get('X-AB-Test-Variant');
  const cacheKey = `page:${url.pathname}:${abTestVariant || 'default'}`;

  // Check cache
  let response = await cache.match(cacheKey);
  if (response && !isStaleWhileRevalidate(response)) {
    return addPerformanceHeaders(response, 'HIT');
  }

  try {
    // Fetch from origin
    const originResponse = await fetch(request, {
      headers: {
        ...Object.fromEntries(request.headers),
        'User-Agent': 'VisionDay-EdgeWorker/1.0'
      }
    });

    if (!originResponse.ok) {
      return originResponse;
    }

    // Read response body for HTML optimization
    const content = await originResponse.text();
    const contentType = originResponse.headers.get('content-type') || '';

    let optimizedContent = content;

    // Apply HTML optimizations for HTML responses
    if (contentType.includes('text/html')) {
      optimizedContent = await optimizeHTML(content, request, env);
    }

    // Create optimized response
    const optimizedResponse = new Response(optimizedContent, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: {
        ...Object.fromEntries(originResponse.headers),
        'Cache-Control': `public, max-age=${CONFIG.cache.dynamic}, stale-while-revalidate=86400`,
        'X-Page-Optimized': '1',
        'X-Edge-Cache': response ? 'STALE' : 'MISS',
        ...getSecurityHeaders()
      }
    });

    // Cache the optimized response
    ctx.waitUntil(cache.put(cacheKey, optimizedResponse.clone()));

    return addPerformanceHeaders(optimizedResponse, response ? 'STALE' : 'MISS');

  } catch (error) {
    console.error('Page optimization error:', error);
    // Return cached version if available, otherwise fetch directly
    if (response) {
      return addPerformanceHeaders(response, 'STALE-ERROR');
    }
    return fetch(request);
  }
}

/**
 * Optimize HTML content
 */
async function optimizeHTML(html, request, env) {
  let optimizedHTML = html;

  try {
    // Add resource hints based on user agent and connection
    const userAgent = request.headers.get('user-agent') || '';
    const connectionType = request.headers.get('cf-ray-connection-type') || '';

    optimizedHTML = addResourceHints(optimizedHTML, userAgent, connectionType);

    // Inline critical CSS for above-the-fold content
    optimizedHTML = await inlineCriticalCSS(optimizedHTML);

    // Add preload links for critical resources
    optimizedHTML = addPreloadLinks(optimizedHTML);

    // Optimize images with lazy loading attributes
    optimizedHTML = optimizeImageTags(optimizedHTML);

    // Add performance tracking
    optimizedHTML = addPerformanceTracking(optimizedHTML);

    // Minify HTML (basic minification)
    optimizedHTML = minifyHTML(optimizedHTML);

  } catch (error) {
    console.error('HTML optimization error:', error);
    // Return original HTML if optimization fails
    return html;
  }

  return optimizedHTML;
}

/**
 * Add resource hints to HTML
 */
function addResourceHints(html, userAgent, connectionType) {
  const hints = [];

  // DNS prefetch for external domains
  hints.push('<link rel="dns-prefetch" href="//fonts.googleapis.com">');
  hints.push('<link rel="dns-prefetch" href="//fonts.gstatic.com">');
  hints.push('<link rel="dns-prefetch" href="//cdn.jsdelivr.net">');

  // Preconnect for critical resources
  hints.push('<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>');
  hints.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');

  // Module preload for modern browsers
  if (!userAgent.includes('Trident') && !userAgent.includes('Edge/')) {
    hints.push('<link rel="modulepreload" href="/assets/main.js">');
  }

  // Prefetch for likely navigation (on fast connections)
  if (connectionType !== '2g' && connectionType !== '3g') {
    hints.push('<link rel="prefetch" href="/dashboard">');
    hints.push('<link rel="prefetch" href="/projects">');
  }

  // Insert hints before closing head tag
  return html.replace('</head>', hints.join('\n') + '\n</head>');
}

/**
 * Inline critical CSS
 */
async function inlineCriticalCSS(html) {
  // In production, this would extract and inline critical CSS
  // For now, add a placeholder for critical CSS
  const criticalCSS = `
    <style>
      /* Critical CSS for above-the-fold content */
      body { margin: 0; font-family: Inter, -apple-system, sans-serif; }
      .loading { display: flex; justify-content: center; align-items: center; height: 100vh; }
    </style>
  `;

  return html.replace('</head>', criticalCSS + '\n</head>');
}

/**
 * Add preload links for critical resources
 */
function addPreloadLinks(html) {
  const preloads = [
    '<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>',
    '<link rel="preload" href="/assets/main.css" as="style">',
    '<link rel="preload" href="/assets/main.js" as="script">'
  ];

  return html.replace('</head>', preloads.join('\n') + '\n</head>');
}

/**
 * Optimize image tags with lazy loading
 */
function optimizeImageTags(html) {
  return html.replace(
    /<img([^>]+)>/gi,
    (match, attributes) => {
      // Skip if already has loading attribute
      if (attributes.includes('loading=')) {
        return match;
      }

      // Add lazy loading and optimize src
      let optimizedAttributes = attributes;

      // Add lazy loading (except for critical images)
      if (!attributes.includes('data-critical')) {
        optimizedAttributes += ' loading="lazy"';
      }

      // Add decoding attribute
      if (!attributes.includes('decoding=')) {
        optimizedAttributes += ' decoding="async"';
      }

      return `<img${optimizedAttributes}>`;
    }
  );
}

/**
 * Add performance tracking script
 */
function addPerformanceTracking(html) {
  const trackingScript = `
    <script>
      // Core Web Vitals tracking
      window.addEventListener('load', () => {
        if ('performance' in window) {
          // Track navigation timing
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            console.log('TTFB:', navigation.responseStart - navigation.requestStart);
          }
        }
      });
    </script>
  `;

  return html.replace('</body>', trackingScript + '\n</body>');
}

/**
 * Basic HTML minification
 */
function minifyHTML(html) {
  return html
    .replace(/\s+/g, ' ')  // Multiple whitespace to single space
    .replace(/>\s+</g, '><')  // Remove whitespace between tags
    .trim();
}

/**
 * Get security headers
 */
function getSecurityHeaders() {
  return {
    'Strict-Transport-Security': CONFIG.security.hsts,
    'Content-Security-Policy': CONFIG.security.csp,
    'X-Frame-Options': CONFIG.security.xFrameOptions,
    'X-Content-Type-Options': CONFIG.security.xContentTypeOptions,
    'X-XSS-Protection': CONFIG.security.xXssProtection,
    'Referrer-Policy': CONFIG.security.referrerPolicy,
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

/**
 * Add performance headers
 */
function addPerformanceHeaders(response, cacheStatus) {
  const headers = new Headers(response.headers);
  headers.set('X-Edge-Cache', cacheStatus);
  headers.set('X-Edge-Location', 'CF-Worker');
  headers.set('Server-Timing', `edge;dur=0, cache;desc="${cacheStatus}"`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Check if file should be compressed
 */
function shouldCompress(pathname) {
  const compressibleTypes = ['.js', '.css', '.html', '.json', '.xml', '.svg'];
  return compressibleTypes.some(type => pathname.endsWith(type));
}

/**
 * Check if response is stale and needs revalidation
 */
function isStaleWhileRevalidate(response) {
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = cacheControl.match(/max-age=(\d+)/)?.[1];
  const staleWhileRevalidate = cacheControl.match(/stale-while-revalidate=(\d+)/)?.[1];

  if (!maxAge || !staleWhileRevalidate) {
    return false;
  }

  const responseTime = new Date(response.headers.get('date') || 0).getTime();
  const now = Date.now();
  const age = (now - responseTime) / 1000;

  return age > parseInt(maxAge) && age < (parseInt(maxAge) + parseInt(staleWhileRevalidate));
}