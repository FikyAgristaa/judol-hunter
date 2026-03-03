#!/bin/bash
# Judol Hunter Auto Installer

set -e

echo "========================================="
echo "  JUDOL HUNTER - AUTO INSTALLER"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Update system
echo -e "${YELLOW}[1/10]${NC} Updating system..."
apt update && apt upgrade -y

# Install dependencies
echo -e "${YELLOW}[2/10]${NC} Installing dependencies..."
apt install -y curl wget git unzip zip \
    nodejs npm python3 python3-pip \
    postgresql postgresql-contrib redis-server \
    nginx chromium-browser

# Install PM2
echo -e "${YELLOW}[3/10]${NC} Installing PM2..."
npm install -g pm2

# Clone repository
echo -e "${YELLOW}[4/10]${NC} Cloning repository..."
cd /opt
git clone https://github.com/YOUR_USERNAME/judol-hunter.git
cd judol-hunter

# Setup database
echo -e "${YELLOW}[5/10]${NC} Setting up database..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql <<EOF
CREATE DATABASE judolhunter;
CREATE USER judoluser WITH ENCRYPTED PASSWORD 'JudolHunter123!';
GRANT ALL PRIVILEGES ON DATABASE judolhunter TO judoluser;
EOF

# Setup environment
echo -e "${YELLOW}[6/10]${NC} Configuring environment..."
cp .env.example .env
DB_PASS=$(openssl rand -base64 32)
sed -i "s/DB_PASS=.*/DB_PASS=$DB_PASS/" .env

# Install Node dependencies
echo -e "${YELLOW}[7/10]${NC} Installing Node.js dependencies..."
npm ci --production

# Install Python dependencies
echo -e "${YELLOW}[8/10]${NC} Installing Python dependencies..."
pip3 install -r requirements.txt

# Setup directories
echo -e "${YELLOW}[9/10]${NC} Creating directories..."
mkdir -p data/{screenshots,videos,html,reports} logs

# Create database tables
echo -e "${YELLOW}[10/10]${NC} Creating database tables..."
node scripts/createTables.js

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup firewall
ufw allow 50000/tcp
ufw allow 50001/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  JUDOL HUNTER INSTALLED SUCCESSFULLY!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "📊 Dashboard: ${BLUE}http://$(curl -s ifconfig.me):50001${NC}"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  pm2 status              - Check services"
echo "  pm2 logs judol-hunter   - View logs"
echo "  pm2 monit               - Monitor resources"
echo ""