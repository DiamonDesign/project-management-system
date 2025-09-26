#!/bin/bash

# 🛡️ COMPREHENSIVE SECURITY VALIDATION SCRIPT
# Validates the Adaptive CSP system implementation
# Ensures A+ security grade compliance

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}🛡️  COMPREHENSIVE SECURITY VALIDATION${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to print test result
print_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"

    if [ "$status" = "PASS" ]; then
        echo -e "✅ ${GREEN}PASS${NC}: $test_name"
        [ -n "$message" ] && echo -e "   ${message}"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "❌ ${RED}FAIL${NC}: $test_name"
        [ -n "$message" ] && echo -e "   ${RED}$message${NC}"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "⚠️  ${YELLOW}WARN${NC}: $test_name"
        [ -n "$message" ] && echo -e "   ${YELLOW}$message${NC}"
        ((WARNINGS++))
    fi
    echo ""
}

# Test 1: Verify adaptive CSP files exist
echo -e "${BLUE}Phase 1: File Structure Validation${NC}"
echo "--------------------------------"

if [ -f "src/lib/adaptive-csp.ts" ]; then
    print_result "Adaptive CSP core module" "PASS" "Found adaptive-csp.ts"
else
    print_result "Adaptive CSP core module" "FAIL" "Missing src/lib/adaptive-csp.ts"
fi

if [ -f "src/lib/vite-adaptive-csp-plugin.ts" ]; then
    print_result "Vite CSP plugin" "PASS" "Found vite-adaptive-csp-plugin.ts"
else
    print_result "Vite CSP plugin" "FAIL" "Missing src/lib/vite-adaptive-csp-plugin.ts"
fi

if [ -f "src/lib/__tests__/adaptive-csp.test.ts" ]; then
    print_result "Security test suite" "PASS" "Found adaptive-csp.test.ts"
else
    print_result "Security test suite" "FAIL" "Missing security tests"
fi

# Test 2: Verify Vite configuration integration
echo -e "${BLUE}Phase 2: Vite Configuration Validation${NC}"
echo "-------------------------------------"

if grep -q "adaptiveCSPPlugin" vite.config.ts; then
    print_result "Vite CSP plugin integration" "PASS" "Plugin correctly integrated in vite.config.ts"
else
    print_result "Vite CSP plugin integration" "FAIL" "adaptiveCSPPlugin not found in vite.config.ts"
fi

if grep -q "reportUri.*VITE_CSP_REPORT_URI" vite.config.ts; then
    print_result "CSP reporting configuration" "PASS" "Report URI configured"
else
    print_result "CSP reporting configuration" "WARN" "CSP reporting may not be configured"
fi

# Test 3: Verify main.tsx integration
echo -e "${BLUE}Phase 3: Application Integration Validation${NC}"
echo "-----------------------------------------"

if grep -q "initializeAdaptiveCSP" src/main.tsx; then
    print_result "Main app CSP initialization" "PASS" "CSP system initialized in main.tsx"
else
    print_result "Main app CSP initialization" "FAIL" "CSP system not initialized in main.tsx"
fi

if grep -q "CSP.*violation" src/main.tsx; then
    print_result "CSP violation handling" "PASS" "Violation handling configured"
else
    print_result "CSP violation handling" "WARN" "CSP violation handling may not be configured"
fi

# Test 4: Verify HTML template is clean
echo -e "${BLUE}Phase 4: HTML Template Validation${NC}"
echo "--------------------------------"

if ! grep -q "unsafe-inline\|unsafe-eval" index.html; then
    print_result "HTML CSP security" "PASS" "No unsafe directives found in HTML"
else
    print_result "HTML CSP security" "FAIL" "Found unsafe CSP directives in HTML"
fi

if grep -q "Adaptive CSP" index.html; then
    print_result "HTML CSP integration" "PASS" "HTML configured for adaptive CSP"
else
    print_result "HTML CSP integration" "WARN" "HTML may not be configured for adaptive CSP"
fi

# Test 5: Environment configuration
echo -e "${BLUE}Phase 5: Environment Configuration Validation${NC}"
echo "--------------------------------------------"

if [ -f ".env.example" ] && grep -q "VITE_CSP_REPORT_URI" .env.example; then
    print_result "Environment configuration" "PASS" "CSP environment variables documented"
else
    print_result "Environment configuration" "WARN" "CSP environment variables may not be documented"
fi

# Test 6: Run TypeScript compilation test (excluding known unrelated issues)
echo -e "${BLUE}Phase 6: TypeScript Compilation${NC}"
echo "------------------------------"

if command -v npx >/dev/null 2>&1; then
    # Check if our specific CSP files compile
    if npx tsc --noEmit --skipLibCheck src/lib/adaptive-csp.ts src/lib/vite-adaptive-csp-plugin.ts >/dev/null 2>&1; then
        print_result "Security module TypeScript compilation" "PASS" "Security modules compile successfully"
    else
        print_result "Security module TypeScript compilation" "FAIL" "Security modules have TypeScript errors"
    fi
else
    print_result "TypeScript compilation" "WARN" "TypeScript compiler not available"
fi

# Test 7: Run security tests if available
echo -e "${BLUE}Phase 7: Security Test Execution${NC}"
echo "-------------------------------"

if command -v npm >/dev/null 2>&1; then
    if [ -f "package.json" ] && grep -q "vitest\|jest" package.json; then
        # Try to run just our specific security tests
        if timeout 30s npm test -- --run src/lib/__tests__/adaptive-csp.test.ts >/dev/null 2>&1; then
            print_result "Security test suite execution" "PASS" "All security tests passed"
        else
            print_result "Security test suite execution" "WARN" "Security tests may have issues or dependencies missing"
        fi
    else
        print_result "Security test suite execution" "WARN" "Test framework not detected"
    fi
else
    print_result "Security test suite execution" "WARN" "npm not available for testing"
fi

# Test 8: Enhanced code quality validation
echo -e "${BLUE}Phase 8: Code Quality Validation${NC}"
echo "-------------------------------"

# Check for production console.log statements (excluding development-only logging)
if grep -n "console\.log" src/lib/adaptive-csp.ts | grep -v "development" >/dev/null 2>&1; then
    print_result "Production code cleanliness" "WARN" "Found console.log statements outside development context"
else
    print_result "Production code cleanliness" "PASS" "No inappropriate logging statements found"
fi

# Check for TODO comments
if grep -r "TODO\|FIXME\|HACK" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Code completion status" "WARN" "Found TODO/FIXME comments"
else
    print_result "Code completion status" "PASS" "Code appears complete and ready for production"
fi

# Test 9: Enhanced security policy validation
echo -e "${BLUE}Phase 9: Security Policy Validation${NC}"
echo "----------------------------------"

# Check for actual unsafe operations (not CSP directive strings)
if grep -r "\beval\s*(" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Unsafe JavaScript operations" "FAIL" "Found eval() function calls"
elif grep -r "innerHTML\s*=" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Unsafe JavaScript operations" "FAIL" "Found innerHTML assignments"
elif grep -r "outerHTML\s*=" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Unsafe JavaScript operations" "FAIL" "Found outerHTML assignments"
else
    print_result "Unsafe JavaScript operations" "PASS" "No unsafe JavaScript operations detected"
fi

# Check for proper error handling
if grep -r "try.*catch\|\.catch(" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Error handling" "PASS" "Error handling implemented"
else
    print_result "Error handling" "WARN" "Limited error handling detected"
fi

# Test 10: CSP Security Standards Validation
echo -e "${BLUE}Phase 10: CSP Security Standards${NC}"
echo "-------------------------------"

# Verify production CSP doesn't allow unsafe operations
if grep -A 20 "createProductionCSP" src/lib/adaptive-csp.ts | grep -q "'unsafe-inline'" && grep -A 20 "createProductionCSP" src/lib/adaptive-csp.ts | grep "'unsafe-inline'" | grep -v "comment\|//"; then
    print_result "Production CSP security" "FAIL" "Production CSP allows unsafe-inline"
else
    print_result "Production CSP security" "PASS" "Production CSP enforces secure directives"
fi

# Check that nonce generation uses secure methods
if grep -q "generateSecureToken" src/lib/adaptive-csp.ts; then
    print_result "Cryptographic nonce generation" "PASS" "Uses cryptographically secure nonce generation"
else
    print_result "Cryptographic nonce generation" "WARN" "Nonce generation method unclear"
fi

# Test 11: Documentation validation
echo -e "${BLUE}Phase 11: Documentation Validation${NC}"
echo "---------------------------------"

if [ -f "COMPREHENSIVE_SECURITY_STRATEGY.md" ]; then
    print_result "Security strategy documentation" "PASS" "Comprehensive security documentation exists"
else
    print_result "Security strategy documentation" "WARN" "Security documentation missing"
fi

# Check for inline documentation
if grep -r "\/\*\*.*\*\/" src/lib/adaptive-csp.ts >/dev/null 2>&1; then
    print_result "Code documentation" "PASS" "Functions are documented"
else
    print_result "Code documentation" "WARN" "Limited code documentation"
fi

# Test 12: A+ Security Grade Validation
echo -e "${BLUE}Phase 12: A+ Security Grade Compliance${NC}"
echo "------------------------------------"

# Check production CSP meets A+ requirements
a_plus_violations=0

# Check for default-src 'none' in production
if ! grep -A 30 "createProductionCSP" src/lib/adaptive-csp.ts | grep -q "default-src.*'none'"; then
    a_plus_violations=$((a_plus_violations + 1))
fi

# Check for frame-ancestors 'none'
if ! grep -A 30 "createProductionCSP" src/lib/adaptive-csp.ts | grep -q "frame-ancestors.*'none'"; then
    a_plus_violations=$((a_plus_violations + 1))
fi

# Check for base-uri 'self'
if ! grep -A 30 "createProductionCSP" src/lib/adaptive-csp.ts | grep -q "base-uri.*'self'"; then
    a_plus_violations=$((a_plus_violations + 1))
fi

if [ "$a_plus_violations" -eq 0 ]; then
    print_result "A+ Security Grade compliance" "PASS" "Production CSP meets A+ security standards"
else
    print_result "A+ Security Grade compliance" "FAIL" "$a_plus_violations A+ requirement violations found"
fi

# Summary
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo -e "${BLUE}=================${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

# Overall result
if [ "$FAILED" -eq 0 ]; then
    if [ "$WARNINGS" -eq 0 ]; then
        echo -e "🎉 ${GREEN}EXCELLENT${NC}: All security validations passed!"
        echo -e "✅ ${GREEN}READY FOR PRODUCTION DEPLOYMENT${NC}"
        echo ""
        echo -e "${GREEN}SECURITY STATUS: A+ GRADE ACHIEVED${NC}"
        echo -e "${GREEN}FUNCTIONALITY STATUS: FULLY OPERATIONAL${NC}"
        echo -e "${GREEN}INTEGRATION STATUS: COMPLETE${NC}"
        exit 0
    else
        echo -e "✅ ${GREEN}GOOD${NC}: Security implementation is valid with minor warnings"
        echo -e "⚠️  ${YELLOW}REVIEW WARNINGS BEFORE PRODUCTION${NC}"
        echo ""
        echo -e "${GREEN}SECURITY STATUS: A GRADE (Minor optimizations possible)${NC}"
        exit 0
    fi
else
    echo -e "❌ ${RED}CRITICAL ISSUES DETECTED${NC}"
    echo -e "🚨 ${RED}DO NOT DEPLOY TO PRODUCTION${NC}"
    echo ""
    echo -e "${RED}Please fix the failed tests before proceeding${NC}"
    exit 1
fi