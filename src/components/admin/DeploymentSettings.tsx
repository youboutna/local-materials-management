import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useConfiguration } from '@/hooks/hexagonal/useConfigurationHex';

const DeploymentSettings = () => {
  const {
    templates,
    selectedTemplate,
    currentConfig,
    selectTemplate,
    generateEnvironmentVariables,
    generateDockerCompose,
    validateConfig,
    copyToClipboard,
    downloadFile
  } = useConfiguration();

  const getDifficultyBadge = (difficulty: string) => {
    const variants = {
      'Easy': 'default',
      'Medium': 'secondary',
      'Hard': 'destructive',
      'Expert': 'destructive'
    } as const;

    return <Badge variant={variants[difficulty as keyof typeof variants]}>{difficulty}</Badge>;
  };

  const handleTemplateSelect = (templateId: string) => {
    selectTemplate(templateId);
  };

  const handleCopyEnvironment = () => {
    if (currentConfig) {
      const envVars = generateEnvironmentVariables(currentConfig);
      copyToClipboard(envVars, 'Environment');
    }
  };

  const handleDownloadEnvironment = () => {
    if (currentConfig) {
      const envVars = generateEnvironmentVariables(currentConfig);
      downloadFile(envVars, '.env');
    }
  };

  const handleCopyDockerCompose = () => {
    if (selectedTemplate) {
      const dockerCompose = generateDockerCompose(selectedTemplate.id);
      if (dockerCompose) {
        copyToClipboard(dockerCompose, 'Docker Compose');
      }
    }
  };

  const handleDownloadDockerCompose = () => {
    if (selectedTemplate) {
      const dockerCompose = generateDockerCompose(selectedTemplate.id);
      if (dockerCompose) {
        downloadFile(dockerCompose, 'docker-compose.yml');
      }
    }
  };

  const handleValidateConfig = () => {
    if (currentConfig) {
      const validation = validateConfig(currentConfig);
      if (validation.valid) {
        // Show success message
        console.log('Configuration is valid');
      } else {
        // Show errors
        console.error('Configuration errors:', validation.errors);
      }
    }
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
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {template.config.features.realtime ? <Cloud className="h-5 w-5" /> : <Container className="h-5 w-5" />}
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.recommended && (
                    <Badge variant="default" className="text-xs">Recommended</Badge>
                  )}
                </div>
                {getDifficultyBadge(template.difficulty)}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span>{template.cost}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.config.features.realtime && (
                    <Badge variant="outline" className="text-xs">Real-time</Badge>
                  )}
                  {template.config.features.edgeFunctions && (
                    <Badge variant="outline" className="text-xs">Edge Functions</Badge>
                  )}
                  {template.config.features.monitoring && (
                    <Badge variant="outline" className="text-xs">Monitoring</Badge>
                  )}
                  {template.config.features.caching && (
                    <Badge variant="outline" className="text-xs">Caching</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Details */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTemplate.name} Configuration
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
                      onClick={handleCopyEnvironment}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadEnvironment}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  {currentConfig && generateEnvironmentVariables(currentConfig)}
                </pre>
              </TabsContent>
              
              <TabsContent value="docker" className="space-y-4">
                {selectedTemplate.id === 'docker' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Docker Compose Configuration</h4>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyDockerCompose}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadDockerCompose}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      {generateDockerCompose(selectedTemplate.id)}
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
                  {selectedTemplate.setupSteps.map((step, index) => (
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
      )}

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