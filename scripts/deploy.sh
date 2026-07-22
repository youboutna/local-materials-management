#!/bin/bash

# HadraTech-GPI — deployment helper.
# Provider selection is read from .env (canonical vars documented in
# docs/SELF_HOSTING.md):
#   VITE_AUTH_PROVIDER    supabase | gotrue | keycloak | local
#   VITE_DATA_PROVIDER    supabase | postgrest | local
#   VITE_STORAGE_PROVIDER supabase | s3 | minio | local
#
# Usage: ./scripts/deploy.sh [--with-docker] [--supabase-local]

set -e


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="mauritanian-materials"
NODE_VERSION="18"
POSTGRES_VERSION="14"
USE_DOCKER=false
USE_LOCAL_SUPABASE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-docker)
      USE_DOCKER=true
      shift
      ;;
    --supabase-local)
      USE_LOCAL_SUPABASE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--with-docker] [--supabase-local]"
      echo "  --with-docker     Use Docker for deployment"
      echo "  --supabase-local  Set up local Supabase instance"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 Starting deployment of $PROJECT_NAME${NC}"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️  Running as root. Consider using a non-root user for security.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js
install_nodejs() {
    echo -e "${BLUE}📦 Installing Node.js $NODE_VERSION...${NC}"
    
    if command_exists node; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_CURRENT -ge $NODE_VERSION ]]; then
            echo -e "${GREEN}✅ Node.js $NODE_CURRENT is already installed${NC}"
            return
        fi
    fi
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
}

# Function to install PostgreSQL
install_postgresql() {
    echo -e "${BLUE}🐘 Installing PostgreSQL $POSTGRES_VERSION...${NC}"
    
    if command_exists psql; then
        echo -e "${GREEN}✅ PostgreSQL is already installed${NC}"
        return
    fi
    
    sudo apt-get update
    sudo apt-get install -y postgresql-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
}

# Function to setup database
setup_database() {
    echo -e "${BLUE}🗄️  Setting up database...${NC}"
    
    DB_NAME="mauritanian_materials"
    DB_USER="app_user"
    DB_PASS=$(openssl rand -base64 32)
    
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    echo "DB_CONNECTION_STRING=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME" > .env.local
    echo -e "${GREEN}✅ Database setup complete${NC}"
    echo -e "${YELLOW}📝 Database credentials saved to .env.local${NC}"
}

# Function to install Docker
install_docker() {
    echo -e "${BLUE}🐳 Installing Docker...${NC}"
    
    if command_exists docker; then
        echo -e "${GREEN}✅ Docker is already installed${NC}"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker installed${NC}"
    echo -e "${YELLOW}⚠️  Please log out and back in for Docker group changes to take effect${NC}"
}

# Function to setup Supabase locally
setup_supabase_local() {
    echo -e "${BLUE}⚡ Setting up local Supabase...${NC}"
    
    if ! command_exists supabase; then
        npm install -g supabase
    fi
    
    if [[ ! -f "supabase/config.toml" ]]; then
        supabase init
    fi
    
    supabase start
    
    echo -e "${GREEN}✅ Local Supabase started${NC}"
    echo -e "${YELLOW}📝 Check 'supabase status' for connection details${NC}"
}

# Function to build and deploy application
deploy_application() {
    echo -e "${BLUE}🏗️  Building and deploying application...${NC}"
    
    # Install dependencies
    npm install
    
    # Build application
    npm run build
    
    # Setup nginx configuration
    if command_exists nginx; then
        sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name localhost;
    root /var/www/$PROJECT_NAME;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    gzip on;
    gzip_types text/css application/javascript application/json;
}
EOF
        
        sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
        sudo mkdir -p /var/www/$PROJECT_NAME
        sudo cp -r dist/* /var/www/$PROJECT_NAME/
        sudo systemctl reload nginx
        
        echo -e "${GREEN}✅ Nginx configured${NC}"
    fi
    
    # Setup PM2 for process management
    if command_exists pm2; then
        pm2 delete $PROJECT_NAME 2>/dev/null || true
        pm2 start npm --name $PROJECT_NAME -- start
        pm2 save
        pm2 startup
        echo -e "${GREEN}✅ PM2 configured${NC}"
    fi
}

# Function to deploy with Docker
deploy_with_docker() {
    echo -e "${BLUE}🐳 Deploying with Docker...${NC}"
    
    # Create Dockerfile if it doesn't exist
    if [[ ! -f "Dockerfile" ]]; then
        cat > Dockerfile <<EOF
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    fi
    
    # Create nginx.conf if it doesn't exist
    if [[ ! -f "nginx.conf" ]]; then
        cat > nginx.conf <<EOF
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/css application/javascript application/json;
}
EOF
    fi
    
    # Build and run with Docker Compose
    docker-compose up -d --build
    
    echo -e "${GREEN}✅ Application deployed with Docker${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    # Update package manager
    sudo apt-get update
    
    # Install basic dependencies
    sudo apt-get install -y curl wget git build-essential
    
    if [[ $USE_DOCKER == true ]]; then
        install_docker
        deploy_with_docker
    else
        install_nodejs
        
        if [[ $USE_LOCAL_SUPABASE == false ]]; then
            install_postgresql
            setup_database
        else
            install_docker  # Docker needed for local Supabase
            setup_supabase_local
        fi
        
        deploy_application
    fi
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo -e "  1. Configure your domain/DNS settings"
    echo -e "  2. Set up SSL certificates (Let's Encrypt recommended)"
    echo -e "  3. Configure firewall rules"
    echo -e "  4. Set up backup procedures"
    
    if [[ $USE_DOCKER == false && $USE_LOCAL_SUPABASE == false ]]; then
        echo -e "  5. Update database connection in your app configuration"
        echo -e "     Database credentials are in .env.local"
    fi
}

# Run main function
main "$@"