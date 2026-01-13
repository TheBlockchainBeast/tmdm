#!/bin/bash

# TON Connect Manifest Setup Script
# This script helps set up the manifest.json file and configure it for GitHub

set -e

echo "🚀 TON Connect Manifest Setup"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Git repository not found. Initializing..."
    git init
    echo "✅ Git repository initialized"
    echo ""
fi

# Get GitHub repository info
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter your repository name: " REPO_NAME
read -p "Enter your branch name (default: main): " BRANCH
BRANCH=${BRANCH:-main}

# Create manifest.json
echo ""
echo "📝 Creating manifest.json..."

cat > public/manifest.json << EOF
{
  "url": "https://tmd-markets.vercel.app",
  "name": "TMD Markets",
  "iconUrl": "https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/public/logo.jpg",
  "termsOfUseUrl": "https://tmd-markets.vercel.app/terms",
  "privacyPolicyUrl": "https://tmd-markets.vercel.app/privacy"
}
EOF

echo "✅ manifest.json created"

# Update TonConnectProvider.tsx
echo ""
echo "📝 Updating TonConnectProvider.tsx..."

MANIFEST_URL="https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/public/manifest.json"

# For Windows, we'll use a different approach
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows Git Bash
    sed -i "s|https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/public/manifest.json|${MANIFEST_URL}|g" components/TonConnectProvider.tsx
else
    # Linux/Mac
    sed -i '' "s|https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/public/manifest.json|${MANIFEST_URL}|g" components/TonConnectProvider.tsx
fi

echo "✅ TonConnectProvider.tsx updated"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo ""
    echo "📝 Creating .env.local..."
    echo "NEXT_PUBLIC_MANIFEST_URL=${MANIFEST_URL}" > .env.local
    echo "✅ .env.local created"
else
    echo ""
    echo "📝 Updating .env.local..."
    if grep -q "NEXT_PUBLIC_MANIFEST_URL" .env.local; then
        # Update existing entry
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            sed -i "s|NEXT_PUBLIC_MANIFEST_URL=.*|NEXT_PUBLIC_MANIFEST_URL=${MANIFEST_URL}|g" .env.local
        else
            sed -i '' "s|NEXT_PUBLIC_MANIFEST_URL=.*|NEXT_PUBLIC_MANIFEST_URL=${MANIFEST_URL}|g" .env.local
        fi
    else
        # Add new entry
        echo "NEXT_PUBLIC_MANIFEST_URL=${MANIFEST_URL}" >> .env.local
    fi
    echo "✅ .env.local updated"
fi

echo ""
echo "📦 Staging files for commit..."
git add public/manifest.json components/TonConnectProvider.tsx .env.local

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review the changes:"
echo "   git status"
echo ""
echo "2. Commit the changes:"
echo "   git commit -m 'Add TON Connect manifest configuration'"
echo ""
echo "3. Push to GitHub:"
echo "   git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"
echo "   git push -u origin ${BRANCH}"
echo ""
echo "4. Verify the manifest is accessible at:"
echo "   ${MANIFEST_URL}"
echo ""
echo "🎉 Your TON Connect manifest is ready!"
