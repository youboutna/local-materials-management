# Welcome to your mauritanian management project for local material.
ce projet est une solution de gestion de projet pour une entreprise utilise des materiaux.suivi de project de construction,
base de données postgresql. géolocalisation des batiments et des projets et sources de matériaux .

# 1.Purpose: 
Manages construction projects that use local Mauritanian materials, 
with features for tracking projects, materials, and geolocation of buildings and material sources.
# 2. Tech Stack:
Frontend: React + TypeScript + Vite
UI: Tailwind CSS + shadcn-ui
State Management: React Query
Animation: Framer Motion
Database: PostgreSQL (via Supabase)
# 3.Core Features:
Project management (creation, tracking, status updates)
Material tracking
User management
Geolocation capabilities
Progress tracking with visual indicators
Multi-language support (French visible in UI)
# 4.Architecture:
Uses TypeORM for database operations with Supabase as a fallback
Implements a modern component-based architecture
Features responsive design with mobile support
Includes authentication via Supabase

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



Simply open [Lovable](https://lovable.dev/projects/539e8f41-564f-4a0a-bf12-5745f07e400b) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
