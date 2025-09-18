// API Protection - Must load before any other scripts
(function() {
  'use strict';

  // Store original APIs before extensions can modify them
  const originalFetch = window.fetch;
  const originalHeaders = window.Headers;
  const originalURL = window.URL;

  // Protect fetch from external modifications
  Object.defineProperty(window, 'fetch', {
    value: function(input, init) {
      // Ensure we use the original fetch
      return originalFetch.call(this, input, init);
    },
    writable: false,
    configurable: false
  });

  // Protect Headers constructor
  Object.defineProperty(window, 'Headers', {
    value: originalHeaders,
    writable: false,
    configurable: false
  });

  // Prevent prototype pollution
  Object.freeze(originalHeaders.prototype);
  Object.freeze(originalFetch);

  console.log('[API Protection] Native APIs protected from external modifications');
})();