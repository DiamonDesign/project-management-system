# 🚀 CSP Quick Reference Guide

## TL;DR - Getting Started

Your CSP system is now fully configured! Here's what you need to know:

### ✅ What Works Now

- **Vite HMR**: Hot module replacement works seamlessly
- **Toast Notifications**: Use the CSP-aware toast functions
- **A+ Security**: Maintained in production builds
- **Development Tools**: Full debugging and browser dev tools support

### 🔧 Quick Migration

1. **Replace toast imports**:
   ```typescript
   // OLD
   import { toast } from 'sonner';

   // NEW
   import { toast } from '@/lib/csp-ui-utils';
   ```

2. **For inline styles** (if needed):
   ```typescript
   // OLD
   <div style="color: red">Text</div>

   // NEW - Use CSS classes
   <div className="text-red-500">Text</div>

   // Or if dynamic styling is needed
   import { injectCSPAwareStyles } from '@/lib/csp-ui-utils';
   ```

## 🛠️ Developer Workflow

### Starting Development

```bash
npm run dev
```

**What happens automatically**:
- CSP system initializes with development-friendly policies
- Hash calculation system starts
- Toast styles are configured
- Violation reporting is enabled with helpful suggestions

### Common Development Tasks

#### 1. Adding Toast Notifications

```typescript
import { toast } from '@/lib/csp-ui-utils';

// Success toast
toast.success('User created successfully!');

// Error handling
try {
  await createUser(data);
  toast.success('User created!');
} catch (error) {
  toast.error('Failed to create user');
}

// Loading states
const promise = createUser(data);
toast.promise(promise, {
  loading: 'Creating user...',
  success: 'User created!',
  error: 'Failed to create user'
});
```

#### 2. Working with Dynamic Styles

```typescript
import { injectCSPAwareStyles } from '@/lib/csp-ui-utils';

// Safe dynamic style injection
const styles = `
  .dynamic-component {
    background: ${theme.primaryColor};
    color: ${theme.textColor};
  }
`;

injectCSPAwareStyles(styles, 'dynamic-theme');
```

#### 3. Loading External Scripts

```typescript
import { loadScriptWithCSP } from '@/lib/csp-ui-utils';

// Load external library safely
await loadScriptWithCSP('https://cdn.example.com/library.js', {
  integrity: 'sha384-...', // Optional but recommended
  crossOrigin: 'anonymous'
});
```

### Debugging CSP Issues

#### Console Tools

```javascript
// Check CSP system status
window.__CSP_UTILS__.environment; // 'development' or 'production'

// Run health check
performCSPHealthCheck();

// Debug specific inline content
debugCSPViolation('some inline content', 'style');
```

#### Reading Console Output

**✅ Good Signs**:
```
🛡️ CSP initialized for development environment
🔢 Hash calculation enabled for inline content
✅ No CSP compliance issues found
🎉 CSP system is fully operational!
```

**⚠️ Watch Out For**:
```
⚠️ Found 5 elements with inline style attributes
🛡️ CSP Violation Details - Violated Directive: style-src
```

**❌ Problems**:
```
❌ Failed to calculate trusted hashes
❌ CSP Meta Tag: CSP meta tag missing
```

## 🚨 Troubleshooting

### Common Issues

#### Problem: Toast notifications not showing
```bash
# Solution 1: Check if toast styles are loaded
# Look for: "Toast Styles: Configured" in console

# Solution 2: Verify CSP-aware toast usage
import { toast } from '@/lib/csp-ui-utils'; // ✅ Correct
import { toast } from 'sonner'; // ❌ May cause CSP issues
```

#### Problem: Inline styles blocked
```bash
# Console shows: "style-src 'self' 'nonce-...' blocked inline style"

# Solution: Use CSS classes or CSS variables
# Instead of:
<div style="color: red"> # ❌

# Use:
<div className="text-red-500"> # ✅
```

#### Problem: HMR not working
```bash
# Check console for:
🔄 HMR update - CSP aware

# If missing, check:
# 1. Vite dev server is running
# 2. Browser dev tools Network tab for websocket connections
# 3. CSP allows ws://localhost:* connections
```

#### Problem: Custom scripts blocked
```typescript
// For inline scripts, use nonce
const nonce = window.__CSP_NONCE__;
const script = document.createElement('script');
script.textContent = 'console.log("Hello")';
script.setAttribute('nonce', nonce); // ✅ This will work
document.head.appendChild(script);
```

### Getting Help

1. **Check Console**: Development mode provides detailed CSP violation guidance
2. **Run Health Check**: `performCSPHealthCheck()` in browser console
3. **Review Documentation**: See `README-CSP-ARCHITECTURE.md` for complete guide

## 🏗️ Production Deployment

### Before Deploying

```bash
# 1. Build and test
npm run build

# 2. Check for CSP violations in build
# Look for: "✅ Production build completed with A+ security CSP"

# 3. Test production build locally
npm run preview
```

### Production Checklist

- [ ] No CSP violations in production build
- [ ] A+ security grade maintained
- [ ] Toast notifications work correctly
- [ ] All dynamic content has proper hashes or nonces
- [ ] External scripts load correctly

### Environment Variables

```env
# Optional: CSP violation reporting endpoint
VITE_CSP_REPORT_URI=https://your-domain.com/csp-reports

# The system automatically detects production vs development
```

## 🎯 Best Practices

### DO ✅

- Use the CSP-aware toast functions from `csp-ui-utils`
- Prefer CSS classes over inline styles
- Use CSS variables for dynamic theming
- Test in both development and production modes
- Monitor console for CSP violations during development

### DON'T ❌

- Use direct Sonner imports (use CSP-aware wrapper)
- Add inline `style` attributes without considering CSP
- Ignore CSP violations in development console
- Disable CSP for convenience
- Use `eval()` or other unsafe practices

### Performance Tips

- CSS classes are faster than inline styles
- CSS variables enable dynamic theming without CSP violations
- External stylesheets are cached better than inline styles
- Hash-based CSP is more performant than nonce-based

## 🔄 Migration Guide

### From Old CSP System

If you had a previous CSP implementation:

1. **Remove old CSP meta tags** from `index.html`
2. **Update Vite config** to use new adaptive plugin
3. **Replace toast imports** with CSP-aware versions
4. **Test thoroughly** in development mode

### Key Changes

- Hash-based security instead of blanket `unsafe-inline`
- Environment-aware policies (stricter in production)
- Comprehensive violation reporting and debugging
- CSP-aware UI component utilities

## 🚀 Advanced Usage

### Custom Hash Patterns

```typescript
// Add custom trusted content (in development)
import { INLINE_CONTENT_PATTERNS } from '@/lib/csp-hash-calculator';

// Extend patterns for your specific needs
export const CUSTOM_PATTERNS = {
  ...INLINE_CONTENT_PATTERNS,
  myWidget: `
    .my-widget {
      position: fixed;
      z-index: 9999;
    }
  `
};
```

### Custom CSP Directives

```typescript
// Extend CSP for specific domains or features
const customConfig = {
  customDomains: [
    'https://api.myservice.com',
    'wss://websocket.myservice.com'
  ],
  additionalDirectives: {
    'media-src': ['https://media.mycdn.com']
  }
};
```

---

## 💡 Remember

This system is designed to work automatically. Most developers won't need to think about CSP - just use the provided utilities and follow the patterns above. The system handles the complexity while maintaining security.

**Happy coding! 🎉**