# Content Security Policy (CSP) Security Guide

## 🛡️ Security Fix Overview

This document explains the CSP security improvements implemented to fix the XSS vulnerability caused by `'unsafe-inline'` directives.

## ⚠️ Previously Vulnerable Configuration

**BEFORE (UNSAFE):**
```javascript
'script-src': ["'self'", "'unsafe-inline'"]  // XSS VULNERABILITY
'style-src': ["'self'", "'unsafe-inline'"]   // XSS VULNERABILITY
```

**AFTER (SECURE):**
```javascript
'script-src': ["'self'"]  // Secure - only external scripts allowed
'style-src': ["'self'"]   // Secure - only external stylesheets allowed
```

## 🔧 Implementation Changes

### 1. Externalized Inline Script

**Previously:** Large inline script in `index.html` (lines 32-131)
**Now:** External script at `/public/error-handler.js`

```html
<!-- OLD: Inline script (CSP violation) -->
<script>
  window.session = window.session || null;
  // ... 100+ lines of inline code
</script>

<!-- NEW: External script (CSP compliant) -->
<script src="/error-handler.js"></script>
```

### 2. Updated Security Configuration

**Location:** `/src/lib/security.ts`

**New Functions:**
- `createSecureCSPDirectives()` - Generates secure CSP without unsafe-inline
- `generateNonce()` - Creates nonces for future inline content if needed
- `generateCSPMetaTag()` - Creates CSP meta tag content
- `getCSPMiddlewareConfig()` - Express middleware configuration

**Deprecated Functions:**
- `cspDirectives` - Legacy configuration (marked @deprecated)

### 3. HTML Template Update

**Location:** `/index.html`

```html
<!-- Secure CSP Meta Tag -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self'; ..." />
```

### 4. Nginx Configuration Update

**Location:** `/nginx.conf`

Updated to use secure CSP headers without `'unsafe-inline'` directives.

## 🔒 Security Benefits

### XSS Attack Prevention
- **Before:** Attackers could inject `<script>` tags that would execute
- **After:** Only scripts from same origin are allowed, preventing XSS

### Content Injection Protection
- **Before:** Malicious styles could be injected inline
- **After:** Only external stylesheets from same origin are permitted

### Defense in Depth
- Multiple layers: HTML meta tag, HTTP headers, nginx configuration
- Consistent policy across all environments (dev, staging, production)

## 📋 Developer Guidelines

### ✅ Allowed Practices

1. **External Scripts:**
   ```html
   <script src="/my-script.js"></script>
   <script type="module" src="/src/main.tsx"></script>
   ```

2. **External Stylesheets:**
   ```html
   <link rel="stylesheet" href="/styles.css">
   ```

3. **React Inline Styles (via style prop):**
   ```jsx
   <div style={{ color: 'red', fontSize: '16px' }}>Content</div>
   ```

### ❌ Forbidden Practices

1. **Inline Scripts:**
   ```html
   <!-- CSP VIOLATION - Will be blocked -->
   <script>console.log('inline script');</script>
   ```

2. **Inline Event Handlers:**
   ```html
   <!-- CSP VIOLATION - Will be blocked -->
   <button onclick="handleClick()">Click</button>
   ```

3. **Inline Styles:**
   ```html
   <!-- CSP VIOLATION - Will be blocked -->
   <div style="color: red;">Content</div>
   ```

4. **Style Tags:**
   ```html
   <!-- CSP VIOLATION - Will be blocked -->
   <style>body { margin: 0; }</style>
   ```

### 🔄 Migration from Inline Content

If you need to add inline scripts or styles:

1. **Move to External Files:**
   ```javascript
   // Instead of inline script, create /public/my-script.js
   (function() {
     // Your script code here
   })();
   ```

2. **Use Nonces (Advanced):**
   ```javascript
   // For special cases, generate nonce
   import { generateNonce, createSecureCSPDirectives } from '@/lib/security';
   
   const scriptNonce = generateNonce();
   const csp = createSecureCSPDirectives(scriptNonce);
   ```

3. **React Event Handlers:**
   ```jsx
   // Instead of onclick attribute
   function MyComponent() {
     const handleClick = () => console.log('clicked');
     return <button onClick={handleClick}>Click</button>;
   }
   ```

## 🧪 Testing CSP Compliance

### Browser Console Testing

1. Open browser developer tools
2. Navigate to your application
3. Check Console for CSP violations:
   ```
   Refused to execute inline script because it violates CSP directive
   ```

### Automated Testing

```javascript
// Test CSP headers are present
describe('CSP Security', () => {
  test('should have secure CSP headers', async () => {
    const response = await fetch('/');
    const csp = response.headers.get('content-security-policy');
    
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("'unsafe-inline'");
  });
});
```

### CSP Violation Reporting

To monitor CSP violations in production:

```javascript
// Add report-uri directive (future enhancement)
const cspWithReporting = createSecureCSPDirectives();
cspWithReporting['report-uri'] = ['/csp-violation-report'];
```

## 🚀 Deployment Considerations

### Development Environment
- CSP is enforced via meta tags in HTML
- Vite dev server can add CSP headers (future enhancement)

### Production Environment
- Nginx serves CSP headers
- HTML also contains CSP meta tag as backup
- Multiple security layers ensure protection

### Content Delivery Networks (CDN)
If using CDNs, update CSP to allow them:

```javascript
const cspWithCDN = createSecureCSPDirectives();
cspWithCDN['script-src'].push('https://trusted-cdn.com');
cspWithCDN['style-src'].push('https://trusted-cdn.com');
```

## 🐛 Troubleshooting Common Issues

### Problem: React App Won't Load

**Symptom:** Blank page, CSP violations in console
**Solution:** Ensure all scripts are external and properly referenced

### Problem: Styles Not Applied

**Symptom:** Unstyled content, style CSP violations
**Solution:** Move inline styles to external CSS files or use React's style prop

### Problem: Third-party Scripts Blocked

**Symptom:** Analytics, chat widgets don't work
**Solution:** Add trusted domains to CSP directives:

```javascript
const csp = createSecureCSPDirectives();
csp['script-src'].push('https://www.google-analytics.com');
```

### Problem: Dynamic Content Loading

**Symptom:** User-generated content blocked
**Solution:** Sanitize content server-side, use nonces for trusted dynamic content

## 📚 Further Resources

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Guidelines](https://owasp.org/www-project-cheat-sheets/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator Tool](https://csp-evaluator.withgoogle.com/)

## 🔄 Future Enhancements

1. **CSP Reporting:** Implement violation reporting endpoint
2. **Nonce-based Inline Content:** For trusted dynamic content
3. **Hash-based CSP:** Allow specific inline scripts via SHA-256 hashes
4. **Strict-dynamic:** More flexible script loading for modern applications