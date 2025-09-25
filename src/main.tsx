import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { BrowserRouter } from "react-router-dom";

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

  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent app crash
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('Root element not found! Application cannot start.');
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Application Error</h1><p>Failed to initialize. Please refresh the page.</p></div>';
} else {
  try {
    createRoot(rootElement).render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  } catch (error) {
    console.error('Failed to render application:', error);
    rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Application Error</h1><p>Failed to start. Please refresh the page or try disabling browser extensions.</p></div>';
  }
}