#!/bin/bash

# GitHub Repository Setup Script
# Run this after accepting Xcode license agreement

echo "🚀 Setting up GitHub repository for project-management-system"

# Navigate to project directory
cd "/Users/gorkaguirre/Documents/APPs/Proyectos/Proyectos"

# Check git status
echo "📋 Current git status:"
git status

# Check if we have any existing remotes
echo "🔗 Current remotes:"
git remote -v

# Remove any existing origin if present
git remote remove origin 2>/dev/null || true

# Get GitHub username
USERNAME=$(git config user.name)
if [ -z "$USERNAME" ]; then
    echo "⚠️  Git username not configured. Checking GitHub CLI..."
    if command -v gh &> /dev/null; then
        USERNAME=$(gh api user --jq .login)
        echo "✅ Found GitHub username: $USERNAME"
    else
        echo "❌ Please set your git username first:"
        echo "   git config --global user.name 'YOUR_USERNAME'"
        echo "   or install GitHub CLI: brew install gh"
        exit 1
    fi
fi

# Add the new GitHub repository as origin
echo "🔗 Adding GitHub repository as origin..."
git remote add origin https://github.com/$USERNAME/project-management-system.git

# Check the current branch
current_branch=$(git branch --show-current)
echo "🌿 Current branch: $current_branch"

# Make sure we're on main branch (rename if needed)
if [ "$current_branch" != "main" ]; then
    echo "🔄 Renaming branch to main..."
    git branch -M main
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Create initial commit if needed
if git diff --staged --quiet; then
    echo "✅ No changes to commit - repository is already up to date"
else
    echo "📝 Creating initial commit..."
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
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo "✅ Repository setup complete!"
echo "🌐 Repository URL: https://github.com/$USERNAME/project-management-system"

# Optional: Open the repository in browser
if command -v gh &> /dev/null; then
    echo "🌐 Opening repository in browser..."
    gh repo view --web
else
    echo "🌐 Open in browser: https://github.com/$USERNAME/project-management-system"
fi