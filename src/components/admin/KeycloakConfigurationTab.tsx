
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Download, Server, Database, Cloud, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function KeycloakConfigurationTab() {
  const [activeTab, setActiveTab] = useState('development');
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  
  const handleDeploy = (environment: string) => {
    setIsDeploying(true);
    
    // Simulate deployment process
    setTimeout(() => {
      setIsDeploying(false);
      
      toast({
        title: 'Déploiement réussi',
        description: `Keycloak a été déployé avec succès en ${environment === 'development' ? 'développement' : 'production'}.`,
      });
    }, 2000);
  };
  
  const dockerComposeContent = `version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - keycloak_network

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: ["start-dev"]
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak_pass
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - keycloak_network

volumes:
  postgres_data:

networks:
  keycloak_network:
    driver: bridge`;

  const dockerfileContent = `FROM quay.io/keycloak/keycloak:latest

# Add custom themes or providers
COPY ./themes/ /opt/keycloak/themes/
COPY ./providers/ /opt/keycloak/providers/

# Enable health checks
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \\
  CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev"]`;

  const setupScriptContent = `#!/bin/bash

# Install PostgreSQL
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE keycloak;"
sudo -u postgres psql -c "CREATE USER keycloak WITH PASSWORD 'keycloak_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;"

# Install Keycloak
wget https://github.com/keycloak/keycloak/releases/download/22.0.5/keycloak-22.0.5.tar.gz
tar -xvzf keycloak-22.0.5.tar.gz
cd keycloak-22.0.5/bin/

# Start Keycloak with PostgreSQL
./kc.sh build --db postgres --db-url jdbc:postgresql://localhost:5432/keycloak \\
  --db-username keycloak --db-password keycloak_pass

# Start Keycloak in production mode
./kc.sh start --optimized`;

  const pythonScriptContent = `import subprocess
import os

def setup_keycloak():
    # Install PostgreSQL
    subprocess.run(["sudo", "apt-get", "update"])
    subprocess.run(["sudo", "apt-get", "install", "-y", "postgresql", "postgresql-contrib"])

    # Configure DB
    subprocess.run(["sudo", "-u", "postgres", "psql", "-c", "CREATE DATABASE keycloak;"])
    subprocess.run(["sudo", "-u", "postgres", "psql", "-c", "CREATE USER keycloak WITH PASSWORD 'keycloak_pass';"])
    subprocess.run(["sudo", "-u", "postgres", "psql", "-c", "GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;"])

    # Download and extract Keycloak
    if not os.path.exists("keycloak-22.0.5"):
        subprocess.run(["wget", "https://github.com/keycloak/keycloak/releases/download/22.0.5/keycloak-22.0.5.tar.gz"])
        subprocess.run(["tar", "-xvzf", "keycloak-22.0.5.tar.gz"])

    # Start Keycloak
    os.chdir("keycloak-22.0.5/bin")
    subprocess.run(["./kc.sh", "build", "--db", "postgres", "--db-url", "jdbc:postgresql://localhost:5432/keycloak",
                   "--db-username", "keycloak", "--db-password", "keycloak_pass"])
    subprocess.run(["./kc.sh", "start", "--optimized"])

if __name__ == "__main__":
    setup_keycloak()`;

  const githubWorkflowContent = `name: Keycloak Deployment

on:
  push:
    branches:
      - main
      - dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Dev (Docker)
        if: github.ref == 'refs/heads/dev'
        run: |
          docker-compose up -d --build

      - name: Deploy Prod (Shell)
        if: github.ref == 'refs/heads/main'
        run: |
          chmod +x setup_keycloak_prod.sh
          ./setup_keycloak_prod.sh`;

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Téléchargement réussi',
      description: `Le fichier ${filename} a été téléchargé.`,
    });
  };

  return (
    <Tabs defaultValue="development" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-6">
        <TabsTrigger value="development" className="flex items-center gap-2">
          <Server className="h-4 w-4" /> Développement
        </TabsTrigger>
        <TabsTrigger value="production" className="flex items-center gap-2">
          <Cloud className="h-4 w-4" /> Production
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="development" className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Configuration pour l'environnement de développement uniquement. Utilisez Docker Compose pour une mise en place rapide.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Docker Compose
            </CardTitle>
            <CardDescription>
              Configuration Docker Compose pour déployer Keycloak avec PostgreSQL en environnement de développement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="docker-compose">docker-compose.yml</Label>
                <Textarea 
                  id="docker-compose" 
                  value={dockerComposeContent}
                  className="font-mono text-sm h-64"
                  readOnly
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => handleDownload(dockerComposeContent, 'docker-compose.yml')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger
            </Button>
            <Button 
              onClick={() => handleDeploy('development')}
              disabled={isDeploying}
              className="bg-adrar-600 hover:bg-adrar-700"
            >
              {isDeploying ? 'Déploiement...' : 'Déployer'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" /> Dockerfile (Optionnel)
            </CardTitle>
            <CardDescription>
              Dockerfile pour créer une image Keycloak personnalisée avec des thèmes ou des fournisseurs personnalisés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="dockerfile">Dockerfile</Label>
              <Textarea 
                id="dockerfile" 
                value={dockerfileContent}
                className="font-mono text-sm h-48"
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              onClick={() => handleDownload(dockerfileContent, 'Dockerfile')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="production" className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Configuration pour l'environnement de production. Utiliser avec précaution sur des serveurs dédiés.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" /> Script Shell
            </CardTitle>
            <CardDescription>
              Script bash pour configurer Keycloak avec PostgreSQL sur un serveur Linux.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="shell-script">setup_keycloak_prod.sh</Label>
              <Textarea 
                id="shell-script" 
                value={setupScriptContent}
                className="font-mono text-sm h-64"
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              onClick={() => handleDownload(setupScriptContent, 'setup_keycloak_prod.sh')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" /> Script Python
            </CardTitle>
            <CardDescription>
              Script Python pour automatiser le déploiement de Keycloak en production.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="python-script">deploy_keycloak.py</Label>
              <Textarea 
                id="python-script" 
                value={pythonScriptContent}
                className="font-mono text-sm h-64"
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline"
              onClick={() => handleDownload(pythonScriptContent, 'deploy_keycloak.py')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" /> GitHub Actions CI/CD
            </CardTitle>
            <CardDescription>
              Configuration de GitHub Actions pour le déploiement automatisé de Keycloak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="github-workflow">github-actions.yml</Label>
              <Textarea 
                id="github-workflow" 
                value={githubWorkflowContent}
                className="font-mono text-sm h-48"
                readOnly
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => handleDownload(githubWorkflowContent, '.github/workflows/keycloak-deployment.yml')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger
            </Button>
            <Button 
              onClick={() => handleDeploy('production')}
              disabled={isDeploying}
              className="bg-adrar-600 hover:bg-adrar-700"
            >
              {isDeploying ? 'Déploiement...' : 'Déployer'}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
