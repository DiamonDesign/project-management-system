# 📦 Deployment Guide

This document provides comprehensive instructions for deploying the React/TypeScript project with all security, performance, and accessibility improvements.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Docker (for containerized deployment)

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🔧 Build Configuration

### Production Build

```bash
# Standard production build
pnpm build

# Development build (with source maps)
pnpm build:dev

# With production config
vite build --config vite.config.production.ts
```

### Environment Variables

Create `.env.production` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
VITE_APP_NAME="Your App Name"
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Security Configuration
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Build the image
docker build -t your-app:latest .

# Run container
docker run -p 80:80 your-app:latest

# With environment variables
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  your-app:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## ☁️ Cloud Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# With environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

### Netlify

```bash
# Build and deploy
netlify deploy --prod --dir=dist

# Or use netlify.toml configuration
```

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### AWS S3 + CloudFront

```bash
# Build the app
pnpm build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## 🔒 Security Configuration

### Content Security Policy

The application includes a strict CSP in `nginx.conf`:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.supabase.io wss://realtime.supabase.io;
  media-src 'none';
  object-src 'none';
  child-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  upgrade-insecure-requests;
" always;
```

### Security Headers

All deployments include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictions

## 📊 Performance Monitoring

### Bundle Analysis

```bash
# Analyze bundle size
npx vite-bundle-analyzer dist

# Check bundle composition
ls -la dist/assets/
```

### Core Web Vitals Monitoring

The app includes performance monitoring for:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

## 🧪 Testing in Production

### Health Checks

```bash
# Application health
curl -f https://your-domain.com/health

# Performance check
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
```

### Smoke Tests

```bash
# Basic functionality test
curl -f https://your-domain.com/
curl -f https://your-domain.com/login
curl -f https://your-domain.com/projects
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Security Audit**: Dependency vulnerability scanning
2. **Code Quality**: Linting, type checking, formatting
3. **Testing**: Unit tests with coverage reporting
4. **Build**: Production build with artifact upload
5. **Container Security**: Docker image vulnerability scanning
6. **Deployment**: Automated deployment to staging/production
7. **Health Checks**: Post-deployment verification

### Manual Deployment

```bash
# Run full CI pipeline locally
pnpm audit
pnpm lint
pnpm type-check
pnpm test:run --coverage
pnpm build

# Security checks
docker build -t app:test .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image app:test
```

## 📱 Progressive Web App

The application is PWA-ready with:
- Service worker for offline functionality
- Web app manifest
- Responsive design
- Touch-friendly interactions

## ♿ Accessibility

The application includes:
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode support
- Focus management
- ARIA labels and descriptions

## 🐛 Troubleshooting

### Common Issues

1. **Build fails with memory error**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" pnpm build
   ```

2. **CORS issues in production**:
   - Check Supabase CORS configuration
   - Verify environment variables

3. **Static asset 404 errors**:
   - Ensure proper routing configuration
   - Check asset paths in build output

4. **Performance issues**:
   - Enable gzip compression
   - Check bundle size and code splitting
   - Verify CDN configuration

### Debug Mode

```bash
# Enable verbose logging
DEBUG=vite:* pnpm build

# Check bundle analysis
ANALYZE=true pnpm build
```

## 📈 Monitoring

### Error Tracking

Consider integrating:
- Sentry for error monitoring
- LogRocket for session replay
- Google Analytics for usage tracking

### Performance Monitoring

- Lighthouse CI for performance scoring
- Web Vitals reporting
- Bundle size tracking

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Security headers implemented
- [ ] SSL/TLS certificate installed
- [ ] CDN configured
- [ ] Database migrations run
- [ ] Health checks working
- [ ] Error monitoring enabled
- [ ] Performance monitoring active
- [ ] Backup strategy in place
- [ ] Documentation updated

## 🆘 Support

For deployment issues:
1. Check the GitHub Actions logs
2. Verify environment configuration
3. Test locally with production build
4. Check browser console for errors
5. Review server logs

---

**Production Deployment Complete!** 🎉

The application is now deployed with:
- ✅ Security hardening
- ✅ Performance optimization
- ✅ Accessibility compliance
- ✅ Error handling
- ✅ Testing coverage
- ✅ CI/CD pipeline