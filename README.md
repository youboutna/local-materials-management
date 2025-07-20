# Mauritanian Local Materials Management System

A comprehensive solution for managing construction projects using local Mauritanian materials, with project tracking, geolocation capabilities, and material sourcing management.

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
- **Multi-language Support**: French and Arabic interface
- **Real-time Updates**: Live data synchronization

## 📋 Prerequisites

Before installing, ensure you have:
- **Node.js** 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **PostgreSQL** 14+ (for self-hosted database)
- **Git** for version control

 # 5 **Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Are you interested by this project?
-contact hadratech for more information

#  how to deply project 

ll help you deploy this React project on your server. Here's a step-by-step guide to deploy the local-materials-management Portal:

    Build the Project First, you need to build the production version of your React app:

npm run build

This will create a dist folder containing the optimized production build.

    Server Requirements Your server needs:

    A web server (Apache, Nginx, etc.)
    Node.js (for building)
    Optional: PostgreSQL if you're using a local database

    Deployment Options

A. Static File Server (Simplest)

    Upload the contents of the dist folder to your server's web root directory
    Configure your web server to serve index.html for all routes

Example Nginx configuration:

server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/local-materials-management/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

B. Node.js Server

    Install PM2 or similar process manager
    Create a simple Express server to serve the static files

    Database Configuration

    If using PostgreSQL, make sure it's installed and running on your server
    Update the database configuration in the app to point to your local PostgreSQL instance
    Make sure your database is accessible from your application

    Environment Setup Since you're not using Supabase, ensure your PostgreSQL connection details are properly configured in the DatabaseSettings component.



539e8f41-564f-4a0a-bf12-5745f07e400b) and click on Share -> Publish.
