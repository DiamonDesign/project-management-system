import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { BrowserRouter } from "react-router-dom";
import { initializeCSP, debugCSPViolation, performCSPHealthCheck } from "./lib/csp-init";
import { setupToastStyles } from "./lib/csp-ui-utils";

// Initialize comprehensive CSP system BEFORE any other code
async function initializeApp() {
  try {
    console.log('🚀 Initializing application with adaptive CSP...');

    // Initialize complete CSP system with hash calculation
    const cspResult = await initializeCSP({
      reportUri: import.meta.env.VITE_CSP_REPORT_URI,
      customDomains: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com'
      ],
      enableNonces: true,
      enableHashes: true,
      reportViolations: true,
      debug: import.meta.env.DEV
    });

    const { environment, nonce, hashCalculatorReady } = cspResult;

    // Setup CSP-compliant UI styles early
    setupToastStyles();

    // CRITICAL: Global error handler to prevent extension crashes
    // Suppress browser extension errors that can crash the app
    window.onerror = function(message, source, lineno, colno, error) {
      // Known problematic patterns from browser extensions
      const suppressedPatterns = [
        'share-modal.js',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'Extension context invalidated',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'The message port closed before a response was received'
      ];

      // Don't suppress CSP violations in development - we need to see them
      if (environment === 'development' && message && typeof message === 'string') {
        if (message.includes('Content Security Policy') || message.includes('CSP')) {
          console.warn('🛡️ CSP violation detected:', message);
          // Let CSP violations through in development for debugging
          return false;
        }
      }

      if (source && suppressedPatterns.some(pattern => source.includes(pattern))) {
        console.warn('Browser extension error suppressed:', message);
        return true; // Prevent default error handling
      }

      if (message && typeof message === 'string') {
        for (const pattern of suppressedPatterns) {
          if (message.includes(pattern)) {
            console.warn('Known error pattern suppressed:', message);
            return true;
          }
        }
      }

      // Log but don't crash on other errors
      console.error('Application error:', { message, source, lineno, colno, error });
      return true; // Prevent default error handling
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || 'Unknown error';

      // Suppress known extension-related promise rejections
      if (errorMessage.includes('Extension context') ||
          errorMessage.includes('chrome-extension') ||
          errorMessage.includes('share-modal')) {
        console.warn('Extension promise rejection suppressed:', errorMessage);
        event.preventDefault();
        return;
      }

      // In development, show CSP-related rejections but don't suppress them
      if (environment === 'development' &&
          (errorMessage.includes('CSP') || errorMessage.includes('Content Security Policy'))) {
        console.warn('🛡️ CSP-related promise rejection:', errorMessage);
        // Don't prevent in development
        return;
      }

      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent app crash
    });

    // Enhanced CSP violation handling for development
    if (environment === 'development') {
      console.log(`🛡️ Security initialized:
        Environment: ${environment}
        Hash Calculator: ${hashCalculatorReady ? 'Ready' : 'Failed'}
        Nonce Available: ${nonce ? 'Yes' : 'No'}
        Toast Styles: Configured
        Report URI: ${import.meta.env.VITE_CSP_REPORT_URI || 'Not set'}`);

      // Development-specific CSP violation handler with enhanced debugging
      document.addEventListener('securitypolicyviolation', (event) => {
        // Special handling for known Sonner/toast violations
        if (event.sourceFile && event.sourceFile.includes('sonner')) {
          console.info('🍞 Sonner Toast CSP Note:', {
            directive: event.violatedDirective,
            blocked: event.blockedURI,
            message: 'This is expected - toast animations use CSS variables (CSP-safe)'
          });
          return; // Don't show full violation for toast animations
        }

        console.group('🛡️ CSP Violation Details');
        console.warn('Violated Directive:', event.violatedDirective);
        console.warn('Blocked URI:', event.blockedURI);
        console.warn('Source File:', event.sourceFile);
        console.warn('Line:Column:', `${event.lineNumber}:${event.columnNumber}`);

        // Provide specific guidance based on violation type
        if (event.violatedDirective.includes('style-src')) {
          console.log('💡 Style Violation Solutions:');
          console.log('1. Move inline styles to external CSS files');
          console.log('2. Use CSS-in-JS with nonce support');
          console.log('3. Add style hash to CSP (if content is static)');
          console.log('4. Use CSS custom properties (CSS variables)');

          if (event.blockedURI && event.blockedURI.includes('blob:')) {
            console.log('🎨 Blob URL detected: Consider using data URLs or external files');
          }
        }

        if (event.violatedDirective.includes('script-src')) {
          console.log('💡 Script Violation Solutions:');
          console.log('1. Move inline scripts to external files');
          console.log('2. Use nonce attribute for inline scripts');
          console.log('3. Add script hash to CSP (if content is static)');

          if (nonce) {
            console.log(`🔑 Available nonce: ${nonce.substring(0, 8)}...`);
          }
        }

        console.groupEnd();

        // Use the debug utility for detailed analysis
        if (event.sourceFile && event.lineNumber) {
          debugCSPViolation(event.sourceFile,
            event.violatedDirective.includes('style-src') ? 'style' : 'script');
        }
      });

      // Run health check after initialization
      setTimeout(() => {
        const healthCheck = performCSPHealthCheck();
        console.log('🔍 CSP Health Check:', healthCheck);
      }, 1000);
    }

    // Render the application
    const rootElement = document.getElementById("root");

    if (!rootElement) {
      console.error('Root element not found! Application cannot start.');
      document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Application Error</h1><p>Failed to initialize. Please refresh the page.</p></div>';
      return;
    }

    try {
      // Apply nonce to any existing inline styles if needed (for development)
      if (nonce && environment === 'development') {
        // Find and add nonce to any inline style elements
        const inlineStyles = document.querySelectorAll('style:not([nonce]), style[data-emotion]:not([nonce]), style[data-styled]:not([nonce])');
        inlineStyles.forEach((style) => {
          style.setAttribute('nonce', nonce);
        });

        if (inlineStyles.length > 0) {
          console.log(`🔧 Applied nonce to ${inlineStyles.length} existing inline styles`);
        }
      }

      const root = createRoot(rootElement);

      root.render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Post-render CSP compliance check (development only)
      if (environment === 'development') {
        setTimeout(() => {
          console.log('🔍 Post-render CSP compliance check:');

          // Check for any non-CSP compliant inline styles
          const inlineStyleElements = document.querySelectorAll('*[style]');
          const inlineScripts = document.querySelectorAll('script:not([src]):not([nonce])');
          const inlineStyleTags = document.querySelectorAll('style:not([nonce])');

          if (inlineStyleElements.length > 0) {
            console.warn(`⚠️ Found ${inlineStyleElements.length} elements with inline style attributes`);
            // Sample a few for debugging
            Array.from(inlineStyleElements).slice(0, 3).forEach((el, i) => {
              console.log(`  ${i + 1}. ${el.tagName} with style: ${(el as HTMLElement).style.cssText.substring(0, 50)}...`);
            });
          }

          if (inlineScripts.length > 0) {
            console.warn(`⚠️ Found ${inlineScripts.length} inline scripts without nonce`);
          }

          if (inlineStyleTags.length > 0) {
            console.warn(`⚠️ Found ${inlineStyleTags.length} style tags without nonce`);
          }

          if (inlineStyleElements.length === 0 && inlineScripts.length === 0 && inlineStyleTags.length === 0) {
            console.log('✅ No CSP compliance issues found');
          }

          // Check for CSP-aware toast configuration
          const toastContainer = document.querySelector('.sonner-toaster, [data-sonner-toaster]');
          if (toastContainer) {
            console.log('🍞 Toast container found - CSP-aware styling applied');
          }

          // Final health check
          const finalHealthCheck = performCSPHealthCheck();
          if (finalHealthCheck.status === 'healthy') {
            console.log('🎉 CSP system is fully operational!');
            console.log('📊 System Status:');
            finalHealthCheck.checks.forEach(check => {
              console.log(`  ${check.status ? '✅' : '❌'} ${check.name}: ${check.message}`);
            });
          } else {
            console.warn('⚠️ CSP system has some issues:');
            finalHealthCheck.checks.filter(c => !c.status).forEach(check => {
              console.warn(`  ❌ ${check.name}: ${check.message}`);
            });
          }
        }, 2000);
      }

      console.log('✅ Application initialized successfully');

      // Show development mode information
      if (environment === 'development') {
        console.log(`
🛡️ CSP Development Mode Active

Debug Tools Available:
- window.__CSP_UTILS__ - CSP debugging utilities
- Detailed violation logging enabled
- Hash calculation system active
- Nonce-based inline content support

Tips:
- Check console for CSP violations
- Use CSP-aware toast functions from 'lib/csp-ui-utils'
- Test with different inline content scenarios
        `);
      }

    } catch (error) {
      console.error('Failed to render application:', error);
      rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Application Error</h1><p>Failed to start. Please refresh the page or try disabling browser extensions.</p></div>';
    }

  } catch (error) {
    console.error('❌ Failed to initialize CSP system:', error);

    // Fallback initialization without CSP
    console.log('🔄 Attempting fallback initialization...');
    const rootElement = document.getElementById("root");

    if (rootElement) {
      try {
        // Still try to setup basic toast styles even in fallback mode
        setupToastStyles();
      } catch (styleError) {
        console.warn('Failed to setup toast styles in fallback mode:', styleError);
      }

      const root = createRoot(rootElement);
      root.render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      console.log('⚠️ Application started without full CSP initialization');
    }
  }
}

// Start the application
initializeApp().catch(console.error);