# GitHub Repository Setup Guide

## 🚨 Prerequisites

1. **Accept Xcode License Agreement**
   ```bash
   sudo xcodebuild -license accept
   ```

2. **Install GitHub CLI** (if not already installed)
   ```bash
   brew install gh
   ```

3. **Authenticate with GitHub**
   ```bash
   gh auth login
   ```

## 🚀 Quick Setup (Automated)

1. **Create repository on GitHub**
   ```bash
   gh repo create project-management-system \
     --description "Production-ready React project management system with client portal functionality" \
     --public
   ```

2. **Run the deployment script**
   ```bash
   ./deploy_setup.sh
   ```

## 📋 Manual Setup (Alternative)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `project-management-system`
3. Description: `Production-ready React project management system with client portal functionality`
4. Set to **Public**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Step 2: Configure Local Repository
```bash
# Navigate to project
cd "/Users/gorkaguirre/Documents/APPs/Proyectos/Proyectos"

# Check current status
git status
git remote -v

# Remove existing origin if present
git remote remove origin 2>/dev/null || true

# Add GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/project-management-system.git

# Ensure we're on main branch
git branch -M main

# Add and commit all files
git add .
git commit -m "Initial commit: Production-ready React project management system

✨ Features:
- React 18 + TypeScript + Vite 6
- Supabase backend with authentication
- shadcn/ui component library
- Project management with client portal
- Drag & drop task management
- Rich text notes and analytics
- Fully responsive design
- Production build tested ✅

🚀 Generated with Claude Code (https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main
```

## 🔧 Troubleshooting

### Common Issues

1. **Git command not found**
   - Accept Xcode license: `sudo xcodebuild -license accept`

2. **Permission denied (publickey)**
   - Set up SSH key: `gh auth login` and follow prompts
   - Or use HTTPS: `git remote set-url origin https://github.com/USERNAME/project-management-system.git`

3. **Repository already exists**
   - Delete and recreate: `gh repo delete project-management-system --confirm`
   - Or use existing: Update the origin URL in deploy_setup.sh

4. **Username not in git config**
   - Set username: `git config --global user.name "YOUR_USERNAME"`
   - Or manually update the origin URL in deploy_setup.sh

### Verify Setup
```bash
# Check repository status
git status
git remote -v

# View on GitHub
gh repo view --web
```

## 🌐 Deployment Options

Once the repository is set up on GitHub, you can deploy to:

### Vercel (Recommended)
1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
4. Deploy automatically

### Netlify
1. Go to https://netlify.com
2. Connect GitHub repository
3. Build command: `pnpm build`
4. Publish directory: `dist`
5. Configure environment variables

### Other Platforms
- **Railway**: Connect GitHub repo, auto-deploy
- **Render**: Static site deployment
- **GitHub Pages**: With GitHub Actions workflow

## 📊 Post-Deployment

### Repository Features
- ✅ Production-ready codebase
- ✅ Comprehensive documentation
- ✅ Environment configuration
- ✅ Security best practices
- ✅ TypeScript + modern tooling
- ✅ Responsive design
- ✅ Accessibility compliance

### Next Steps
1. Set up CI/CD pipeline
2. Configure deployment environments
3. Set up monitoring and analytics
4. Configure domain and SSL
5. Set up backup and recovery

---

**Repository**: https://github.com/YOUR_USERNAME/project-management-system
**Documentation**: See README.md and DEPLOYMENT_GUIDE.md
**Status**: ✅ Ready for deployment