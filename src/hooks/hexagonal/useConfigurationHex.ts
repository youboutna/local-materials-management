// Configuration Hook - Architecture Hexagonale
// Uses ConfigurationService for deployment and adapter settings

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  ConfigurationService, 
  ConfigurationTemplate, 
  DeploymentConfig,
  DatabaseConfig,
  AuthConfig,
  StorageConfig,
  APIConfig 
} from '@/application/services/ConfigurationService';

export interface UseConfigurationReturn {
  // Configuration templates
  templates: ConfigurationTemplate[];
  selectedTemplate: ConfigurationTemplate | null;
  currentConfig: DeploymentConfig | null;
  
  // Actions
  selectTemplate: (templateId: string) => void;
  setCurrentConfig: (config: DeploymentConfig) => void;
  generateEnvironmentVariables: (config: DeploymentConfig) => string;
  generateDockerCompose: (templateId: string) => string | null;
  
  // Validation
  validateConfig: (config: DeploymentConfig) => { valid: boolean; errors: string[] };
  
  // OAuth Configuration
  getOAuthConfig: (provider: string) => { 
    setupUrl: string; 
    redirectUris: string[];
    setupInstructions: string[];
  };
  
  // Adapter configurations
  getDatabaseConfig: () => DatabaseConfig | null;
  getAuthConfig: () => AuthConfig | null;
  getStorageConfig: () => StorageConfig | null;
  getAPIConfig: () => APIConfig | null;
  
  // Utility functions
  copyToClipboard: (text: string, type: string) => void;
  downloadFile: (content: string, filename: string) => void;
}

export function useConfiguration(): UseConfigurationReturn {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigurationTemplate | null>(null);
  const [currentConfig, setCurrentConfigState] = useState<DeploymentConfig | null>(null);
  
  const configService = ConfigurationService.getInstance();

  // Initialize with templates
  const templates = configService.getConfigurationTemplates();

  // Template selection
  const selectTemplate = useCallback((templateId: string) => {
    const template = configService.getTemplateById(templateId);
    if (template) {
      setSelectedTemplate(template);
      setCurrentConfigState(template.config);
      configService.setCurrentConfig(template.config);
    }
  }, [configService]);

  // Set current configuration
  const setCurrentConfig = useCallback((config: DeploymentConfig) => {
    setCurrentConfigState(config);
    configService.setCurrentConfig(config);
  }, [configService]);

  // Generate environment variables
  const generateEnvironmentVariables = useCallback((config: DeploymentConfig) => {
    return configService.generateEnvironmentVariables(config);
  }, [configService]);

  // Generate Docker Compose
  const generateDockerCompose = useCallback((templateId: string) => {
    const template = configService.getTemplateById(templateId);
    return template?.dockerCompose || null;
  }, [configService]);

  // Validate configuration
  const validateConfig = useCallback((config: DeploymentConfig) => {
    return configService.validateConfig(config);
  }, [configService]);

  // Get OAuth configuration
  const getOAuthConfig = useCallback((provider: string) => {
    return configService.getOAuthConfig(provider);
  }, [configService]);

  // Get adapter configurations
  const getDatabaseConfig = useCallback(() => {
    try {
      return configService.getAdapterConfig('database') as DatabaseConfig;
    } catch {
      return null;
    }
  }, [configService]);

  const getAuthConfig = useCallback(() => {
    try {
      return configService.getAdapterConfig('auth') as AuthConfig;
    } catch {
      return null;
    }
  }, [configService]);

  const getStorageConfig = useCallback(() => {
    try {
      return configService.getAdapterConfig('storage') as StorageConfig;
    } catch {
      return null;
    }
  }, [configService]);

  const getAPIConfig = useCallback(() => {
    try {
      return configService.getAdapterConfig('api') as APIConfig;
    } catch {
      return null;
    }
  }, [configService]);

  // Utility functions
  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${type} configuration copied successfully.`,
    });
  }, [toast]);

  const downloadFile = useCallback((content: string, filename: string) => {
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
  }, [toast]);

  return {
    templates,
    selectedTemplate,
    currentConfig,
    selectTemplate,
    setCurrentConfig,
    generateEnvironmentVariables,
    generateDockerCompose,
    validateConfig,
    getOAuthConfig,
    getDatabaseConfig,
    getAuthConfig,
    getStorageConfig,
    getAPIConfig,
    copyToClipboard,
    downloadFile
  };
}
