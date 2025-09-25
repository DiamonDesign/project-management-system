#!/bin/bash

# Pre-Deploy Security Validation Script
# Run this before deploying to production

echo "🔒 Starting Security Pre-Deploy Checks..."
echo "========================================="

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check for security issues
check_error() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

check_warning() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${YELLOW}⚠${NC} $2"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo ""
echo "1. Checking Content Security Policy..."
echo "---------------------------------------"

# Check for unsafe-inline in index.html
if grep -q "unsafe-inline\|unsafe-eval" index.html 2>/dev/null; then
    check_error 1 "CSP contains unsafe-inline or unsafe-eval"
else
    check_error 0 "CSP is properly configured"
fi

echo ""
echo "2. Checking Environment Variables..."
echo "------------------------------------"

# Check if .env.production exists
if [ -f ".env.production" ]; then
    # Check API Protection
    if grep -q "VITE_API_PROTECTION=false" .env.production 2>/dev/null; then
        check_error 1 "API Protection is disabled in production"
    else
        check_error 0 "API Protection is enabled"
    fi

    # Check for service role key
    if grep -q "service_role\|SERVICE_ROLE" .env.production 2>/dev/null; then
        check_error 1 "Service role key found in production env"
    else
        check_error 0 "No service role key in production env"
    fi
else
    check_warning 1 ".env.production file not found"
fi

echo ""
echo "3. Checking Security Headers..."
echo "-------------------------------"

# Check if vercel.json has headers configured
if [ -f "vercel.json" ]; then
    if grep -q "headers" vercel.json 2>/dev/null; then
        check_error 0 "Security headers are configured"
    else
        check_error 1 "Security headers are NOT configured in vercel.json"
    fi
else
    check_error 1 "vercel.json not found"
fi

echo ""
echo "4. Checking for Debug Files..."
echo "------------------------------"

# Check for test files
TEST_FILES=$(ls -1 test*.html debug*.html loading-test.html incident-test.html 2>/dev/null | wc -l)
if [ $TEST_FILES -gt 0 ]; then
    check_warning 1 "Found $TEST_FILES test/debug HTML files"
else
    check_warning 0 "No test/debug files found"
fi

# Check for debug scripts
DEBUG_SCRIPTS=$(ls -1 debug*.sh test*.sh script.py utility.js 2>/dev/null | wc -l)
if [ $DEBUG_SCRIPTS -gt 0 ]; then
    check_warning 1 "Found $DEBUG_SCRIPTS debug scripts"
else
    check_warning 0 "No debug scripts found"
fi

echo ""
echo "5. Checking Console Statements..."
echo "---------------------------------"

# Check vite.config for console dropping
if grep -q "drop_console: false" vite.config.ts 2>/dev/null; then
    check_warning 1 "Console statements are NOT dropped in production build"
else
    check_warning 0 "Console statements are properly dropped"
fi

echo ""
echo "6. Checking Git Repository..."
echo "----------------------------"

# Check if sensitive files are tracked
SENSITIVE_FILES=$(git ls-files 2>/dev/null | grep -E "\.env\.|\.env$|secret|key|password" | grep -v example | wc -l)
if [ $SENSITIVE_FILES -gt 0 ]; then
    check_error 1 "Found $SENSITIVE_FILES sensitive files in git"
    git ls-files | grep -E "\.env\.|\.env$|secret|key|password" | grep -v example
else
    check_error 0 "No sensitive files tracked in git"
fi

echo ""
echo "7. Checking Dependencies..."
echo "---------------------------"

# Run security audit
if command -v pnpm &> /dev/null; then
    VULNS=$(pnpm audit --json 2>/dev/null | grep -o '"critical":[0-9]*' | cut -d':' -f2)
    if [ "$VULNS" = "0" ] || [ -z "$VULNS" ]; then
        check_error 0 "No critical vulnerabilities in dependencies"
    else
        check_error 1 "Found $VULNS critical vulnerabilities"
    fi
elif command -v npm &> /dev/null; then
    echo "Using npm audit (pnpm preferred)..."
    npm audit --audit-level=critical 2>/dev/null
    if [ $? -eq 0 ]; then
        check_error 0 "No critical vulnerabilities found"
    else
        check_warning 1 "Vulnerabilities detected - review npm audit"
    fi
else
    check_warning 1 "Could not run dependency audit"
fi

echo ""
echo "8. Checking Build Configuration..."
echo "----------------------------------"

# Check if source maps are disabled
if grep -q "sourcemap: false" vite.config.ts 2>/dev/null; then
    check_error 0 "Source maps are disabled for production"
else
    check_warning 1 "Source maps may be enabled in production"
fi

echo ""
echo "========================================="
echo "SECURITY CHECK SUMMARY"
echo "========================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ FAILED:${NC} Fix $ERRORS critical security issues before deploying!"
    echo ""
    echo "Required Actions:"
    echo "1. Remove unsafe-inline and unsafe-eval from CSP"
    echo "2. Configure security headers in vercel.json"
    echo "3. Enable API protection in all environments"
    echo "4. Remove any sensitive files from git history"
    echo ""
    echo "Run this script again after fixing the issues."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING:${NC} $WARNINGS non-critical issues found"
    echo ""
    echo "Recommended Actions:"
    echo "1. Remove test and debug files"
    echo "2. Enable console dropping in production"
    echo "3. Review and fix any warnings above"
    echo ""
    echo "Deploy with caution or fix warnings first."
    exit 0
else
    echo -e "${GREEN}✅ PASSED:${NC} All security checks passed!"
    echo ""
    echo "Your application is ready for secure deployment."
    exit 0
fi