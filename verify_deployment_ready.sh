#!/bin/bash

# Deployment Readiness Verification Script
# Checks if the project is ready for GitHub deployment

echo "🔍 Verifying deployment readiness for project-management-system"
echo "============================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

check_warning() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo
echo "🔧 System Requirements"
echo "---------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_status 0 "Node.js installed ($NODE_VERSION)"
else
    check_status 1 "Node.js not found"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_status 0 "pnpm installed ($PNPM_VERSION)"
else
    check_warning "pnpm not found (can use npm as alternative)"
fi

# Check git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    check_status 0 "Git installed ($GIT_VERSION)"
else
    check_status 1 "Git not found"
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n1)
    check_status 0 "GitHub CLI installed ($GH_VERSION)"
else
    check_warning "GitHub CLI not found (manual setup required)"
fi

echo
echo "📁 Project Structure"
echo "-------------------"

# Navigate to project directory
cd "/Users/gorkaguirre/Documents/APPs/Proyectos/Proyectos" 2>/dev/null
if [ $? -eq 0 ]; then
    check_status 0 "Project directory accessible"
else
    check_status 1 "Cannot access project directory"
    exit 1
fi

# Check essential files
files=(
    "package.json"
    "README.md"
    "DEPLOYMENT_GUIDE.md"
    ".gitignore"
    ".env.example"
    "vite.config.ts"
    "tsconfig.json"
    "src/App.tsx"
    "src/main.tsx"
    "index.html"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        check_status 0 "$file exists"
    else
        check_status 1 "$file missing"
    fi
done

# Check directories
dirs=(
    "src"
    "src/components"
    "src/pages"
    "src/context"
    "public"
    ".github/workflows"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        check_status 0 "$dir/ directory exists"
    else
        check_status 1 "$dir/ directory missing"
    fi
done

echo
echo "🔨 Build System"
echo "---------------"

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    check_status 0 "Dependencies installed"
else
    check_warning "Dependencies not installed (run: pnpm install)"
fi

# Check if dist exists (previous build)
if [ -d "dist" ]; then
    check_status 0 "Production build exists"

    # Check build size
    if command -v du &> /dev/null; then
        BUILD_SIZE=$(du -sh dist/ | cut -f1)
        check_info "Build size: $BUILD_SIZE"
    fi
else
    check_warning "No production build found (run: pnpm build)"
fi

echo
echo "🔄 Git Repository"
echo "----------------"

# Check git repository
if [ -d ".git" ]; then
    check_status 0 "Git repository initialized"
else
    check_status 1 "Git repository not initialized"
fi

# Check git status
if git status &> /dev/null; then
    check_status 0 "Git commands working"

    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        check_status 0 "No uncommitted changes"
    else
        check_warning "Uncommitted changes detected"
        echo "   Run: git add . && git commit -m 'Pre-deployment commit'"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    if [ "$CURRENT_BRANCH" = "main" ]; then
        check_status 0 "On main branch"
    else
        check_warning "Not on main branch (current: $CURRENT_BRANCH)"
    fi

    # Check remote
    if git remote get-url origin &> /dev/null; then
        ORIGIN_URL=$(git remote get-url origin)
        check_info "Remote origin: $ORIGIN_URL"
    else
        check_warning "No remote origin configured"
    fi

else
    check_status 1 "Git commands not working (Xcode license?)"
    echo "   Fix with: sudo xcodebuild -license accept"
fi

echo
echo "📋 Configuration Files"
echo "---------------------"

# Check environment configuration
if [ -f ".env.example" ]; then
    if grep -q "VITE_SUPABASE_URL" ".env.example"; then
        check_status 0 "Environment template configured"
    else
        check_status 1 "Environment template incomplete"
    fi
fi

# Check TypeScript configuration
if [ -f "tsconfig.json" ]; then
    if jq . tsconfig.json &> /dev/null; then
        check_status 0 "TypeScript config valid"
    else
        check_warning "TypeScript config may have syntax issues"
    fi
fi

# Check package.json
if [ -f "package.json" ]; then
    if jq . package.json &> /dev/null; then
        check_status 0 "package.json valid"

        # Check scripts
        SCRIPTS=$(jq -r '.scripts | keys[]' package.json 2>/dev/null)
        if echo "$SCRIPTS" | grep -q "build"; then
            check_status 0 "Build script configured"
        else
            check_status 1 "Build script missing"
        fi

        if echo "$SCRIPTS" | grep -q "dev"; then
            check_status 0 "Dev script configured"
        else
            check_status 1 "Dev script missing"
        fi
    else
        check_status 1 "package.json has syntax errors"
    fi
fi

echo
echo "🚀 Deployment Scripts"
echo "--------------------"

# Check deployment scripts
if [ -f "deploy_setup.sh" ]; then
    if [ -x "deploy_setup.sh" ]; then
        check_status 0 "Deployment script ready"
    else
        check_warning "Deployment script not executable (fix: chmod +x deploy_setup.sh)"
    fi
else
    check_status 1 "Deployment script missing"
fi

if [ -f "GITHUB_SETUP.md" ]; then
    check_status 0 "GitHub setup guide available"
else
    check_status 1 "GitHub setup guide missing"
fi

if [ -f "DEPLOYMENT_SUMMARY.md" ]; then
    check_status 0 "Deployment summary available"
else
    check_status 1 "Deployment summary missing"
fi

echo
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

echo
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 PROJECT IS READY FOR DEPLOYMENT!${NC}"
    echo
    echo "Next steps:"
    echo "1. Fix Xcode license: sudo xcodebuild -license accept"
    echo "2. Run deployment: ./deploy_setup.sh"
    echo "3. Or see GITHUB_SETUP.md for manual setup"
else
    echo -e "${RED}❌ PROJECT NEEDS FIXES BEFORE DEPLOYMENT${NC}"
    echo
    echo "Please resolve the failed checks above before deploying."
fi

echo
echo "📖 Documentation:"
echo "   - README.md - Project overview and setup"
echo "   - DEPLOYMENT_GUIDE.md - Platform-specific deployment"
echo "   - GITHUB_SETUP.md - Repository creation guide"
echo "   - DEPLOYMENT_SUMMARY.md - Complete deployment overview"