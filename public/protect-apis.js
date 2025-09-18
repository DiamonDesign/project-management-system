// Emergency API Restoration - Fight extension interference
(function() {
  'use strict';

  // Create iframe to get clean APIs
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.documentElement.appendChild(iframe);

  const cleanWindow = iframe.contentWindow;
  const cleanFetch = cleanWindow.fetch;
  const cleanHeaders = cleanWindow.Headers;

  // Remove iframe immediately
  document.documentElement.removeChild(iframe);

  // Aggressively override with clean APIs
  window.fetch = function(input, init) {
    // Validate headers before making request
    if (init && init.headers) {
      const validatedHeaders = {};
      Object.entries(init.headers).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && typeof value === 'string') {
          validatedHeaders[key] = value.trim();
        }
      });
      init.headers = validatedHeaders;
    }
    return cleanFetch.call(this, input, init);
  };

  window.Headers = cleanHeaders;

  // Seal the window to prevent further modifications
  Object.defineProperty(window, 'fetch', {
    writable: false,
    configurable: false
  });

  Object.defineProperty(window, 'Headers', {
    writable: false,
    configurable: false
  });

  console.log('[Emergency Protection] Clean APIs restored, extensions blocked');
})();