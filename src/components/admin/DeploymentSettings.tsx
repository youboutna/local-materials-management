import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Server, 
  Container, 
  Cloud, 
  Download, 
  Copy, 
  ExternalLink,
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

const DeploymentSettings = () => {
  const { toast } = useToast();
  const [selectedScenario, setSelectedScenario] = useState('supabase');

  const deploymentScenarios = [
    {
      id: 'supabase',
      name: 'Full Supabase',
      description: 'Easiest deployment with managed services',
      icon: <Cloud className="h-5 w-5" />,
      difficulty: 'Easy',
      cost: 'Low-Medium',
      features: ['Managed Auth', 'PostgreSQL DB', 'File Storage', 'Real-time', 'Edge Functions'],
      recommended: true
    },
    {
      id: 'docker',
      name: 'Self-Hosted Docker',
      description: 'Full control with Docker containers',
      icon: <Container className="h-5 w-5" />,
      difficulty: 'Medium',
      cost: 'Low',
      features: ['Keycloak Auth', 'PostgreSQL', 'MinIO Storage', 'PostgREST API', 'Full Control']
    },
    {
      id: 'hybrid',
      name: 'Cloud Hybrid',
      description: 'Mix of managed and self-hosted services',
      icon: <Server className="h-5 w-5" />,
      difficulty: 'Hard',
      cost: 'Medium-High',
      features: ['Auth0/Keycloak', 'Managed DB', 'Cloud Storage', 'Custom API', 'Scalable']
    },
    {
      id: 'enterprise',
      name: 'Enterprise On-Premise',
      description: 'Full enterprise deployment',
      icon: <Server className="h-5 w-5" />,
      difficulty: 'Expert',
      cost: 'High',
      features: ['LDAP/AD Auth', 'HA PostgreSQL', 'Enterprise Storage', 'Custom Services', 'Maximum Security']
    }
  ];

  const envConfigs = {
    supabase: `# Supabase Deployment
VITE_AUTH_PROVIDER=supabase
VITE_DB_PROVIDER=supabase
VITE_STORAGE_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_API_URL=https://your-project.supabase.co/rest/v1`,

    docker: `# Docker Self-Hosted Deployment
VITE_AUTH_PROVIDER=keycloak
VITE_DB_PROVIDER=postgresql
VITE_STORAGE_PROVIDER=minio
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=etr-ml
VITE_KEYCLOAK_CLIENT_ID=etr-ml-frontend
VITE_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/etrml
VITE_STORAGE_ENDPOINT=http://localhost:9000
VITE_API_URL=http://localhost:4000/api`,

    hybrid: `# Cloud Hybrid Deployment
VITE_AUTH_PROVIDER=auth0
VITE_DB_PROVIDER=postgresql
VITE_STORAGE_PROVIDER=s3
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_DATABASE_URL=postgresql://user:pass@your-db-host:5432/db
VITE_STORAGE_ENDPOINT=https://s3.amazonaws.com
VITE_STORAGE_BUCKET=your-bucket
VITE_API_URL=https://your-api.com/api`,

    enterprise: `# Enterprise On-Premise Deployment
VITE_AUTH_PROVIDER=keycloak
VITE_DB_PROVIDER=postgresql
VITE_STORAGE_PROVIDER=local
VITE_KEYCLOAK_URL=https://auth.company.com
VITE_KEYCLOAK_REALM=company-realm
VITE_KEYCLOAK_CLIENT_ID=etr-ml-client
VITE_DATABASE_URL=postgresql://user:pass@db.company.com:5432/etrml
VITE_STORAGE_ENDPOINT=https://storage.company.com
VITE_API_URL=https://api.company.com/api`
  };

  const dockerCompose = `version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: etrml
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    command: ["start-dev"]
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/etrml
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  postgrest:
    image: postgrest/postgrest:latest
    environment:
      PGRST_DB_URI: postgres://postgres:postgres@postgres:5432/etrml
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
  minio_data:`;

  const deploymentSteps = {
    supabase: [
      'Create a Supabase account at supabase.com',
      'Create a new project',
      'Copy the project URL and publishable key',
      'Update your environment variables',
      'Deploy your frontend to Vercel/Netlify',
      'Configure authentication providers in Supabase dashboard'
    ],
    docker: [
      'Install Docker and Docker Compose',
      'Download the docker-compose.yml file',
      'Run "docker-compose up -d" to start services',
      'Configure Keycloak realm and client',
      'Set up MinIO buckets and policies',
      'Deploy your frontend application'
    ],
    hybrid: [
      'Set up Auth0 or preferred auth provider',
      'Create managed database (AWS RDS, Google Cloud SQL)',
      'Configure cloud storage (S3, Azure Blob)',
      'Deploy backend API services',
      'Set up CDN and load balancer',
      'Deploy frontend application'
    ],
    enterprise: [
      'Set up on-premise infrastructure',
      'Install and configure Keycloak with LDAP/AD',
      'Set up PostgreSQL cluster with high availability',
      'Configure enterprise storage solutions',
      'Implement security policies and monitoring',
      'Deploy and configure all services'
    ]
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${type} configuration copied successfully.`,
    });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File Downloaded",
      description: `${filename} has been downloaded successfully.`,
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    const variants = {
      'Easy': 'default',
      'Medium': 'secondary',
      'Hard': 'destructive',
      'Expert': 'destructive'
    } as const;

    return <Badge variant={variants[difficulty as keyof typeof variants]}>{difficulty}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Deployment Configuration
          </CardTitle>
          <CardDescription>
            Choose your deployment scenario and get configuration files and setup instructions.
            Each scenario supports different infrastructure requirements and organizational needs.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Deployment Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deploymentScenarios.map((scenario) => (
          <Card 
            key={scenario.id} 
            className={`cursor-pointer transition-all ${
              selectedScenario === scenario.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedScenario(scenario.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {scenario.icon}
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  {scenario.recommended && (
                    <Badge variant="default" className="text-xs">Recommended</Badge>
                  )}
                </div>
                {getDifficultyBadge(scenario.difficulty)}
              </div>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span>{scenario.cost}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {scenario.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {deploymentScenarios.find(s => s.id === selectedScenario)?.name} Configuration
          </CardTitle>
          <CardDescription>
            Configuration files and setup instructions for your selected deployment scenario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="environment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="docker">Docker</TabsTrigger>
              <TabsTrigger value="steps">Setup Steps</TabsTrigger>
            </TabsList>
            
            <TabsContent value="environment" className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Environment Variables (.env)</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(envConfigs[selectedScenario as keyof typeof envConfigs], 'Environment')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(envConfigs[selectedScenario as keyof typeof envConfigs], '.env')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                {envConfigs[selectedScenario as keyof typeof envConfigs]}
              </pre>
            </TabsContent>
            
            <TabsContent value="docker" className="space-y-4">
              {selectedScenario === 'docker' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Docker Compose Configuration</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(dockerCompose, 'Docker Compose')}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(dockerCompose, 'docker-compose.yml')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {dockerCompose}
                  </pre>
                </>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Docker configuration is primarily used for the Self-Hosted scenario. 
                    Other scenarios use managed services or different deployment methods.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="steps" className="space-y-4">
              <h4 className="text-sm font-medium">Setup Instructions</h4>
              <div className="space-y-3">
                {deploymentSteps[selectedScenario as keyof typeof deploymentSteps].map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Helpful links and documentation for your deployment scenario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Deployment Guide Documentation
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Provider-Specific Setup Guides
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Security Best Practices
            </Button>
            <Button variant="outline" className="justify-start">
              <ExternalLink className="h-4 w-4 mr-2" />
              Monitoring & Logging Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentSettings;