#!/bin/bash
# Deploy Script for Agon E-commerce
# Run this on the VPS: /var/www/agon/app/deploy-to-vps.sh

set -e  # Exit on error

echo "🚀 Starting Agon deployment..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Step 1: Pull latest code
echo -e "\n${YELLOW}📥 Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to pull code${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code updated${NC}"

# Step 2: Check environment variables
echo -e "\n${YELLOW}🔍 Step 2: Checking environment variables...${NC}"
if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}❌ Error: apps/web/.env.local not found${NC}"
    echo "Please create it with:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=..."
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
    echo "  MERCADOPAGO_ACCESS_TOKEN=..."
    echo "  MERCADOPAGO_WEBHOOK_SECRET=..."
    echo "  NEXT_PUBLIC_APP_URL=https://your-domain.com"
    exit 1
fi

# Check critical variables
if ! grep -q "MERCADOPAGO_ACCESS_TOKEN=" apps/web/.env.local; then
    echo -e "${RED}❌ Warning: MERCADOPAGO_ACCESS_TOKEN not found in .env.local${NC}"
fi

if ! grep -q "NEXT_PUBLIC_APP_URL=" apps/web/.env.local; then
    echo -e "${RED}❌ Warning: NEXT_PUBLIC_APP_URL not found in .env.local${NC}"
fi

echo -e "${GREEN}✅ Environment file exists${NC}"

# Step 3: Install dependencies
echo -e "\n${YELLOW}📦 Step 3: Installing dependencies...${NC}"
npm install --production=false
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Build application
echo -e "\n${YELLOW}🔨 Step 4: Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Step 5: Restart PM2
echo -e "\n${YELLOW}♻️  Step 5: Restarting application...${NC}"
pm2 restart agon-web
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  PM2 restart failed, trying to start...${NC}"
    pm2 start npm --name agon-web -- run start --prefix apps/web
fi
echo -e "${GREEN}✅ Application restarted${NC}"

# Step 6: Check status
echo -e "\n${YELLOW}📊 Step 6: Checking application status...${NC}"
pm2 status agon-web

# Step 7: Show recent logs
echo -e "\n${YELLOW}📝 Recent logs (last 20 lines):${NC}"
pm2 logs agon-web --lines 20 --nostream

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Test the site: https://your-domain.com"
echo "  2. Monitor logs: pm2 logs agon-web"
echo "  3. Check status: pm2 status"
echo ""
echo "If you see errors, check:"
echo "  - Environment variables: cat apps/web/.env.local"
echo "  - Detailed logs: pm2 logs agon-web --lines 100"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
