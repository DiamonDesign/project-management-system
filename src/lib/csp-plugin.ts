import type { Plugin } from 'vite';
import { generateCSPMetaTag } from './security.js';

/**
 * Vite plugin to inject Content Security Policy during development
 * This ensures CSP is applied consistently across all environments
 */
export function cspPlugin(): Plugin {
  return {
    name: 'csp-plugin',
    transformIndexHtml: {
      enforce: 'pre',
      transform(html) {
        // Only inject CSP if not already present in HTML
        if (!html.includes('Content-Security-Policy')) {
          const cspContent = generateCSPMetaTag();
          const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspContent}" />`;
          
          // Inject CSP meta tag in the head section
          return html.replace(
            '</head>',
            `  ${cspMeta}\n  </head>`
          );
        }
        return html;
      }
    },
    configureServer(server) {
      // Add CSP headers to dev server responses
      server.middlewares.use((req, res, next) => {
        // Don't add CSP to HMR or other dev endpoints
        if (req.url && (req.url.includes('/@') || req.url.includes('__vite'))) {
          return next();
        }
        
        const cspContent = generateCSPMetaTag();
        res.setHeader('Content-Security-Policy', cspContent);
        next();
      });
    }
  };
}