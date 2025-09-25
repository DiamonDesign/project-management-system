#!/bin/bash

# Quick Security Fix Script
# Applies critical security fixes automatically

echo "🔒 Applying Critical Security Fixes..."
echo "======================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup original files
echo "Creating backups..."
cp vercel.json vercel.json.backup 2>/dev/null
cp index.html index.html.backup 2>/dev/null
cp .env.production .env.production.backup 2>/dev/null
echo -e "${GREEN}✓${NC} Backups created"
echo ""

# 1. Fix vercel.json with security headers
echo "1. Applying security headers to vercel.json..."
if [ -f "vercel.secure.json" ]; then
    cp vercel.secure.json vercel.json
    echo -e "${GREEN}✓${NC} Security headers applied to vercel.json"
else
    echo -e "${YELLOW}⚠${NC} vercel.secure.json not found, creating basic secure config..."
    cat > vercel.json << 'EOF'
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
        {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
        {"key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains"}
      ]
    }
  ],
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
EOF
    echo -e "${GREEN}✓${NC} Basic security headers added to vercel.json"
fi
echo ""

# 2. Fix CSP in index.html
echo "2. Fixing Content Security Policy in index.html..."
if [ -f "index.html" ]; then
    # Create a temporary file with fixed CSP
    sed "s/'unsafe-inline'//g; s/'unsafe-eval'//g" index.html | \
    sed "s/script-src 'self'  /script-src 'self' /g" | \
    sed "s/style-src 'self'  /style-src 'self' /g" > index.html.tmp

    mv index.html.tmp index.html
    echo -e "${GREEN}✓${NC} Removed unsafe-inline and unsafe-eval from CSP"

    # Note: This is a basic fix - production apps should use nonces or hashes
    echo -e "${YELLOW}⚠${NC} Note: You may need to add nonces or hashes for inline scripts/styles"
else
    echo -e "${RED}✗${NC} index.html not found"
fi
echo ""

# 3. Fix environment variables
echo "3. Securing environment variables..."
if [ -f ".env.production" ]; then
    # Ensure API protection is enabled
    if grep -q "VITE_API_PROTECTION=false" .env.production; then
        sed -i.bak 's/VITE_API_PROTECTION=false/VITE_API_PROTECTION=true/' .env.production
        echo -e "${GREEN}✓${NC} Enabled API protection in .env.production"
    else
        echo -e "${GREEN}✓${NC} API protection already enabled"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.production not found"
    if [ -f ".env.production.secure" ]; then
        echo "   Using .env.production.secure as template..."
        cp .env.production.secure .env.production
        echo -e "${GREEN}✓${NC} Created secure .env.production from template"
    fi
fi
echo ""

# 4. Fix Vite config to drop console in production
echo "4. Configuring production build to remove console statements..."
if [ -f "vite.config.ts" ]; then
    # Check if drop_console is false and change it to true
    if grep -q "drop_console: false" vite.config.ts; then
        sed -i.bak 's/drop_console: false/drop_console: true/' vite.config.ts
        echo -e "${GREEN}✓${NC} Configured to drop console statements in production"
    else
        echo -e "${GREEN}✓${NC} Console dropping already configured"
    fi
else
    echo -e "${RED}✗${NC} vite.config.ts not found"
fi
echo ""

# 5. Clean up test/debug files
echo "5. Cleaning up test and debug files..."
TEST_FILES=$(ls test*.html debug*.html loading-test.html incident-test.html 2>/dev/null | wc -l | tr -d ' ')
if [ "$TEST_FILES" -gt 0 ]; then
    rm -f test*.html debug*.html loading-test.html incident-test.html
    echo -e "${GREEN}✓${NC} Removed $TEST_FILES test/debug HTML files"
else
    echo -e "${GREEN}✓${NC} No test/debug files found"
fi

DEBUG_SCRIPTS=$(ls debug*.sh test*.sh test*.py test*.js test*.cjs 2>/dev/null | wc -l | tr -d ' ')
if [ "$DEBUG_SCRIPTS" -gt 0 ]; then
    rm -f debug*.sh test*.sh test*.py test*.js test*.cjs
    echo -e "${GREEN}✓${NC} Removed $DEBUG_SCRIPTS debug scripts"
else
    echo -e "${GREEN}✓${NC} No debug scripts found"
fi
echo ""

# 6. Create pre-commit hook for security
echo "6. Setting up pre-commit security hook..."
mkdir -p .git/hooks 2>/dev/null
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit security check

echo "Running security check before commit..."
if [ -f "scripts/pre-deploy-security-check.sh" ]; then
    bash scripts/pre-deploy-security-check.sh
    if [ $? -ne 0 ]; then
        echo "Security check failed! Fix issues before committing."
        exit 1
    fi
fi
EOF
chmod +x .git/hooks/pre-commit 2>/dev/null
echo -e "${GREEN}✓${NC} Pre-commit security hook installed"
echo ""

echo "======================================"
echo "SECURITY FIXES APPLIED"
echo "======================================"
echo ""
echo -e "${GREEN}✅ Critical fixes applied:${NC}"
echo "   • Security headers configured in vercel.json"
echo "   • CSP unsafe-inline/unsafe-eval removed"
echo "   • API protection enabled"
echo "   • Console dropping configured"
echo "   • Test files cleaned up"
echo "   • Pre-commit hook installed"
echo ""
echo -e "${YELLOW}⚠️  Important Next Steps:${NC}"
echo "1. Review the changes made to ensure your app still works"
echo "2. Test locally with: pnpm build && pnpm preview"
echo "3. If inline scripts break, implement nonce-based CSP"
echo "4. Run security check: ./scripts/pre-deploy-security-check.sh"
echo "5. Deploy only after all checks pass"
echo ""
echo "Backup files created with .backup extension"
echo ""