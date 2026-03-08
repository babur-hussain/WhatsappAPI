#!/bin/bash

# ==============================================================================
# LoomiFlow EC2 Deployment Script
# ==============================================================================
# Usage: ./deploy.sh
# 
# Prerequisites: 
# 1. Ensure you have an EC2 instance running Ubuntu/Linux with Docker installed.
# 2. Update the variables below or create a `.env.deploy` file.
# 3. Ensure your SSH key is added (`ssh-add`) or specify it below.
# ==============================================================================

set -e

# --- Configuration ---
# Load from .env.deploy if it exists, otherwise use defaults below
if [ -f .env.deploy ]; then
  source .env.deploy
fi

# Set your EC2 settings here (override via .env.deploy)
EC2_HOST="${EC2_HOST:-16.170.213.68}"
EC2_USER="${EC2_USER:-ubuntu}"
EC2_KEY_PATH="${EC2_KEY_PATH:-Key.pem}"
REMOTE_DIR="${REMOTE_DIR:-~/loomiflow}"

echo "🚀 Starting LoomiFlow Deployment to EC2 ($EC2_HOST)..."

# 1. Sync files to EC2 
echo "📦 Syncing project files to EC2..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.next' -e "ssh -i $EC2_KEY_PATH" ../ $EC2_USER@$EC2_HOST:$REMOTE_DIR/

# 2. Execute Deployment Commands on EC2
echo "⚙️ Building and restarting Docker containers on EC2..."
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
  mkdir -p ~/loomiflow
  cd ~/loomiflow || exit 1
  
  echo "Pulling latest base images..."
  sudo docker compose -f docker-compose.prod.yml pull
  
  echo "Rebuilding backend image and starting services..."
  sudo docker compose -f docker-compose.prod.yml up -d --build backend
  
  echo "Cleaning up dangling images..."
  sudo docker image prune -f
  
  echo "✅ Deployment successful! Backend is running."
EOF

echo "🎉 All Done! Backend pushed to EC2 successfully."
