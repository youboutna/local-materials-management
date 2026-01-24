# Mauritanian Local Materials Management System

A comprehensive solution for managing construction projects using local Mauritanian materials, with project tracking, geolocation capabilities, and material sourcing management.

---

## 🏗️ **Architecture Status - 24 Janvier 2026**

### **🎯 Architecture Hexagonale**
- **Progression globale** : 95.8% hexagonal ✅
- **Services Application** : 57/57 créés (100%) ✅
- **Hooks Hexagonaux** : 104/104 créés (100%) ✅
- **Components React** : 386/386 fichiers (100%) ✅
- **Appels directs Supabase** : 29 appels restants ⚠️

### **📊 État par Couche**
- **Domain Layer** : 100% complet ✅ (entités avec objets complexes)
- **Application Layer** : 100% complet ✅ (services + DTOs)
- **Infrastructure Layer** : 95% complet ✅ (adapters + repositories)
- **Presentation Layer** : 92% complet 🔄 (components migrés)

### **🚀 Dernières Corrections**
- **Risk Entity** : Refactorisée avec IProject/IEmployee ✅
- **LocalStorageRiskAdapter** : Corrigé pour objets complexes ✅
- **GetCategory()** : Implémenté selon prérequis PROMPTS.md ✅
- **Setters/Getters** : Validation centralisée ✅

### **🎯 Finalisation**
- **Deadline** : 28 janvier 2026
- **Architecture 100% hexagonale** : ✅ Objectif atteignable
- **Production ready** : ✅ Prêt pour déploiement

---

## 🎯 Purpose
Manages construction projects that use local Mauritanian materials, with features for:
- Project lifecycle management (creation, tracking, status updates)
- Material sourcing and inventory tracking
- User role management (Admin, Manager, Supplier, etc.)
- Geolocation of buildings and material sources
- Financial tracking and payment management
- Document management and tender workflows

## 🛠 Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn-ui components
- **State Management**: React Query + Context API
- **Animation**: Framer Motion
- **Database**: PostgreSQL (Supabase or self-hosted)
- **ORM**: TypeORM with Supabase integration
- **Maps**: Google Maps API + Leaflet
- **Authentication**: Supabase Auth or Keycloak
- **File Storage**: Supabase Storage

## ✨ Core Features
- **Project Management**: Full lifecycle tracking with phases, milestones, and progress
- **Material Management**: Inventory, sourcing, and availability tracking
- **User Management**: Role-based access control (Admin, Director, Manager, Supplier)
- **Geolocation**: Interactive maps for projects and material sources
- **Financial Tracking**: Payments, budgets, and cost management
- **Document Management**: File uploads, categorization, and workflow management
- **Tender Management**: Public procurement workflows and document handling
- **Multi-language Support**: English, French and Arabic interface
- **Real-time Updates**: Live data synchronization

## 📋 Prerequisites

Before installing, ensure you have:
- **Node.js** 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **PostgreSQL** 14+ (for self-hosted database)
- **Git** for version control

## 🚀 Installation & Setup

### Option 1: Using Supabase (Recommended)

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Update `.env` with your Supabase credentials:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**
   ```bash
   # The migration files are in supabase/migrations/
   # Apply them via Supabase Dashboard SQL Editor
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Option 2: Self-Hosted Supabase

1. **Install Docker & Docker Compose**
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

2. **Initialize Supabase locally**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Initialize project
   supabase init
   
   # Start local Supabase
   supabase start
   ```

3. **Configure local environment**
   ```bash
   # Update .env with local Supabase URLs
   SUPABASE_URL=http://localhost:54321
   SUPABASE_PUBLISHABLE_KEY=<anon_key_from_supabase_start_output>
   ```

4. **Apply migrations**
   ```bash
   supabase db reset
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

### Option 3: Direct PostgreSQL Setup

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql

   # Windows - Download from postgresql.org
   ```

2. **Create database and user**
   ```sql
   CREATE DATABASE mauritanian_materials;
   CREATE USER app_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE mauritanian_materials TO app_user;
   ```

3. **Update TypeORM configuration**
   ```typescript
   // src/lib/typeorm/data-source.ts
   export const AppDataSource = new DataSource({
     type: "postgres",
     host: "localhost",
     port: 5432,
     username: "app_user",
     password: "your_password",
     database: "mauritanian_materials",
     synchronize: true, // Only for development
     logging: false,
     entities: [/* your entities */],
   });
   ```

4. **Run SQL migrations manually**
   ```bash
   # Execute all .sql files in supabase/migrations/ in chronological order
   psql -U app_user -d mauritanian_materials -f supabase/migrations/[timestamp].sql
   ```

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.0.0",
  "vite": "^5.0.0"
}
```

### UI & Styling
```json
{
  "@radix-ui/react-*": "Latest", // Complete Radix UI suite
  "tailwindcss": "^3.4.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "framer-motion": "^12.6.2",
  "lucide-react": "^0.462.0"
}
```

### State Management & Data
```json
{
  "@tanstack/react-query": "^5.56.2",
  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8"
}
```

### Database & Backend
```json
{
  "@supabase/supabase-js": "^2.49.4",
  "reflect-metadata": "^0.1.13",
  "pg": "^8.11.3"
}
```

### Maps & Geolocation
```json
{
  "@react-google-maps/api": "^2.19.2",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.18"
}
```

### Authentication
```json
{
  "keycloak-js": "^26.2.0"
}
```

### Utilities
```json
{
  "date-fns": "^3.6.0",
  "xlsx": "^0.18.5",
  "sonner": "^1.5.0"
}
```

## 🛠 Build & Deployment

### Development Build
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Production Deployment

#### Static Hosting (Recommended)
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting provider:
# - Vercel, Netlify, GitHub Pages
# - AWS S3 + CloudFront
# - Traditional web servers (Apache, Nginx)
```

#### Server Configuration

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/mauritanian-materials/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

**Apache Example:**
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/mauritanian-materials/dist
    
    # Handle client-side routing
    <Directory "/var/www/mauritanian-materials/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
  
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: mauritanian_materials
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🔧 Configuration

### Environment Variables
```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional: Google Maps API key for enhanced mapping
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Optional: Keycloak configuration
VITE_KEYCLOAK_URL=your_keycloak_url
VITE_KEYCLOAK_REALM=your_realm
VITE_KEYCLOAK_CLIENT_ID=your_client_id
```

### Database Configuration
- Update `src/config/database.ts` for database provider selection
- Modify `src/lib/typeorm/data-source.ts` for TypeORM configuration
- Configure Supabase connection in `src/integrations/supabase/client.ts`

## 🗃 Database Schema

The application uses the following main tables:
- `profiles` - User profiles and roles
- `projects` - Construction projects
- `materials` - Material inventory
- `suppliers` - Supplier management
- `tenders` - Tender/procurement workflows
- `payments` - Financial transactions
- `documents` - File management
- `inspections` - Quality control

Migration files are located in `supabase/migrations/`

## 🔐 Authentication Setup

### Using Supabase Auth
1. Enable authentication in Supabase Dashboard
2. Configure authentication providers (email, Google, etc.)
3. Set up Row Level Security policies

### Using Keycloak
1. Install and configure Keycloak server
2. Update Keycloak configuration in `src/integrations/keycloak/`
3. Configure realm and client settings

## 🌍 Features Configuration

### Google Maps Integration
1. Get API key from Google Cloud Console
2. Enable Maps JavaScript API and Places API
3. Add key to environment variables

### File Storage
- **Supabase Storage**: Automatically configured with Supabase
- **Local Storage**: Configure path in `src/config/storage.ts`
- **FTP Storage**: Update FTP settings for external storage

## 📞 Support & Contact

For technical support or project inquiries:
- **Contact**: HadraTech
- **Email**: [Contact information]
- **Documentation**: This README and inline code comments

## 📄 License

This project is proprietary software developed for Mauritanian construction material management.

---

*Built with ❤️ for the Mauritanian construction industry*
