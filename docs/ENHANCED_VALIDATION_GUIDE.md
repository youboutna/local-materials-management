# Enhanced Validation Guide

## Overview

This guide covers the comprehensive enhanced validation system for managing risks, compliance documents, and validation fields related to provisional and definitive reception within the `ProjectWorkflowService`. The system follows hexagonal architecture principles and provides complete integration between risk analysis, compliance management, and reception workflows.

## Architecture

### Hexagonal Architecture Compliance

The enhanced validation system maintains strict hexagonal architecture:

```
Presentation Layer (React Components)
    ↓
Application Layer (Services)
    ↓
Domain Layer (Entities & DTOs)
    ↓
Infrastructure Layer (Repositories & Adapters)
```

### Key Components

1. **ReceptionService** - Manages provisional and definitive reception workflows
2. **EnhancedValidationService** - Comprehensive validation across all project aspects
3. **RiskService** - Risk assessment and management
4. **ComplianceService** - Regulatory compliance tracking
5. **ProjectWorkflowService** - Unified project workflow management

## Installation & Setup

### Dependencies

Ensure all required services and repositories are available:

```typescript
// Core services
import { ReceptionService } from '@/application/services/ReceptionService';
import { EnhancedValidationService } from '@/application/services/EnhancedValidationService';
import { RiskService } from '@/application/services/RiskService';
import { ComplianceService } from '@/application/services/ComplianceService';

// Repositories
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// DTOs
import { ReceptionDTO } from '@/dtos/entities/ReceptionDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { ComplianceItemDTO } from '@/dtos/entities/ComplianceItemDTO';
```

### Service Initialization

```typescript
// Initialize services with repositories
const receptionService = new ReceptionService(
  RepositoryFactory.getReceptionRepository(),
  RepositoryFactory.getDocumentRepository(),
  RepositoryFactory.getInspectionRepository(),
  RepositoryFactory.getEmployeeRepository()
);

const validationService = new EnhancedValidationService(
  RepositoryFactory.getValidationRepository(),
  RepositoryFactory.getProjectRepository(),
  RepositoryFactory.getRiskRepository(),
  RepositoryFactory.getComplianceRepository(),
  RepositoryFactory.getReceptionRepository(),
  RepositoryFactory.getInspectionRepository(),
  RepositoryFactory.getDocumentRepository()
);
```

## Usage Examples

### 1. Reception Management

#### Creating Provisional Reception

```typescript
import { useReceptionManagement } from '@/hooks/hexagonal/useReceptionManagement';

function ProjectReception() {
  const projectId = 'project-123';
  const {
    createProvisionalReception,
    createDefinitiveReception,
    approveProvisionalReception,
    approveDefinitiveReception,
    canCreateDefinitiveReception,
    isProvisionalValid
  } = useReceptionManagement({ projectId });

  const handleCreateProvisional = async () => {
    try {
      const receptionData = {
        scheduledDate: '2024-12-15',
        committee: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        chairmanId: 'chairman-1',
        documents: uploadedFiles,
        notes: 'Provisional reception for Phase 1 completion'
      };

      const result = await createProvisionalReception(receptionData);
      console.log('Provisional reception created:', result);
    } catch (error) {
      console.error('Failed to create provisional reception:', error);
    }
  };

  const handleApproveProvisional = async (receptionId: string) => {
    try {
      const approvalData = {
        findings: [
          {
            id: 'finding-1',
            category: 'conformity',
            severity: 'low',
            description: 'Minor paint touch-ups required',
            resolutionRequired: true,
            resolutionDeadline: '2024-12-20',
            assignedTo: 'contractor-1'
          }
        ],
        conditions: [
          {
            id: 'condition-1',
            description: 'Complete paint touch-ups',
            category: 'corrective',
            priority: 'low',
            deadline: '2024-12-20',
            responsibleParty: 'contractor-1',
            status: 'pending'
          }
        ],
        validUntil: '2025-03-15',
        notes: 'Approved with minor conditions',
        approvedBy: 'inspector-1',
        certificateNumber: 'PR-2024-001'
      };

      const result = await approveProvisionalReception(receptionId, approvalData);
      console.log('Provisional reception approved:', result);
    } catch (error) {
      console.error('Failed to approve provisional reception:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCreateProvisional}>
        Create Provisional Reception
      </button>
      {canCreateDefinitiveReception() && (
        <button onClick={handleCreateDefinitive}>
          Create Definitive Reception
        </button>
      )}
    </div>
  );
}
```

#### Creating Definitive Reception

```typescript
const handleCreateDefinitive = async () => {
  try {
    const receptionData = {
      scheduledDate: '2024-12-20',
      committee: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      chairmanId: 'chairman-1',
      provisionalReceptionId: 'prov-rec-123',
      documents: uploadedFiles,
      notes: 'Definitive reception for project completion'
    };

    const result = await createDefinitiveReception(receptionData);
    console.log('Definitive reception created:', result);
  } catch (error) {
    console.error('Failed to create definitive reception:', error);
  }
};
```

### 2. Risk Management

#### Enhanced Risk Analysis

```typescript
import { EnhancedRiskAnalysisStep } from '@/components/project/steps/EnhancedRiskAnalysisStep';

function ProjectRiskManagement() {
  const [projectData, setProjectData] = useState({
    id: 'project-123',
    title: 'Sample Project',
    risks: []
  });

  const handleRiskUpdate = (updatedData: Partial<ProjectDTO>) => {
    setProjectData(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <EnhancedRiskAnalysisStep
      formData={projectData}
      onUpdate={handleRiskUpdate}
      isEditing={true}
    />
  );
}
```

#### Risk Service Integration

```typescript
import { RiskService } from '@/application/services/RiskService';

class RiskManager {
  private riskService: RiskService;

  constructor() {
    this.riskService = new RiskService(RepositoryFactory.getRiskRepository());
  }

  async createHighRiskItem(projectId: string) {
    const riskData = {
      projectId,
      title: 'Structural Integrity Risk',
      description: 'Potential structural issues identified during inspection',
      category: 'technical',
      probability: 8,
      impact: 9,
      mitigation: 'Conduct detailed structural analysis and reinforce as needed',
      contingency: 'Have emergency repair team on standby',
      status: 'identified',
      owner: 'structural-engineer-1',
      reviewDate: '2024-12-15',
      costs: 50000,
      timelineImpact: 14
    };

    return await this.riskService.createRisk(riskData);
  }

  async getRiskSummary(projectId: string) {
    const risks = await this.riskService.getRisksByProject(projectId);
    
    return {
      total: risks.length,
      critical: risks.filter(r => (r.probability * r.impact) > 70).length,
      high: risks.filter(r => (r.probability * r.impact) > 50 && (r.probability * r.impact) <= 70).length,
      medium: risks.filter(r => (r.probability * r.impact) > 25 && (r.probability * r.impact) <= 50).length,
      low: risks.filter(r => (r.probability * r.impact) <= 25).length,
      totalCost: risks.reduce((sum, r) => sum + (r.costs || 0), 0)
    };
  }
}
```

### 3. Compliance Management

#### Enhanced Compliance Step

```typescript
import { EnhancedComplianceStep } from '@/components/project/steps/EnhancedComplianceStep';

function ProjectComplianceManagement() {
  const [projectData, setProjectData] = useState({
    id: 'project-123',
    title: 'Sample Project',
    compliance: []
  });

  const handleComplianceUpdate = (updatedData: Partial<ProjectDTO>) => {
    setProjectData(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <EnhancedComplianceStep
      formData={projectData}
      onUpdate={handleComplianceUpdate}
      isEditing={true}
    />
  );
}
```

#### Compliance Service Integration

```typescript
import { ComplianceService } from '@/application/services/ComplianceService';

class ComplianceManager {
  private complianceService: ComplianceService;

  constructor() {
    this.complianceService = new ComplianceService(RepositoryFactory.getComplianceRepository());
  }

  async createRegulatoryCompliance(projectId: string) {
    const complianceData = {
      projectId,
      title: 'Building Permit Compliance',
      description: 'Ensure all building permits are valid and up-to-date',
      type: 'regulatory',
      status: 'pending',
      priority: 'critical',
      responsible: 'compliance-officer-1',
      deadline: '2024-12-01',
      category: 'Regulatory',
      complianceLevel: 'partial',
      riskLevel: 'critical',
      mitigationRequired: true,
      mitigationPlan: 'Submit permit renewal application 30 days before expiry'
    };

    return await this.complianceService.createComplianceItem(complianceData);
  }

  async getComplianceDashboard(projectId: string) {
    const complianceItems = await this.complianceService.getComplianceByProject(projectId);
    
    return {
      total: complianceItems.length,
      approved: complianceItems.filter(c => c.status === 'approved').length,
      pending: complianceItems.filter(c => c.status === 'pending').length,
      overdue: complianceItems.filter(c => 
        c.deadline && new Date(c.deadline) < new Date() && c.status !== 'approved'
      ).length,
      critical: complianceItems.filter(c => c.priority === 'critical').length,
      overallScore: complianceItems.length > 0 
        ? Math.round((complianceItems.filter(c => c.status === 'approved').length / complianceItems.length) * 100)
        : 0
    };
  }
}
```

### 4. Enhanced Validation

#### Complete Project Validation

```typescript
import { EnhancedValidationService } from '@/application/services/EnhancedValidationService';

class ValidationManager {
  private validationService: EnhancedValidationService;

  constructor() {
    this.validationService = new EnhancedValidationService(
      RepositoryFactory.getValidationRepository(),
      RepositoryFactory.getProjectRepository(),
      RepositoryFactory.getRiskRepository(),
      RepositoryFactory.getComplianceRepository(),
      RepositoryFactory.getReceptionRepository(),
      RepositoryFactory.getInspectionRepository(),
      RepositoryFactory.getDocumentRepository()
    );
  }

  async performCompleteValidation(projectId: string, validatedBy: string) {
    try {
      const validationResult = await this.validationService.validateProjectComplete(projectId, validatedBy);
      
      console.log('Validation Results:', {
        isValid: validationResult.isValid,
        overallScore: validationResult.overallScore,
        criticalIssues: validationResult.criticalIssues.length,
        categories: validationResult.categories.map(cat => ({
          category: cat.category,
          score: cat.score,
          status: cat.status,
          issues: cat.issues.length
        }))
      });

      return validationResult;
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  }

  async getValidationTrends(projectId: string, months: number = 12) {
    const trends = await this.validationService.getValidationTrends(projectId, months);
    
    return {
      overallTrend: this.calculateTrend(trends.scores),
      categoryTrends: Object.entries(trends.categories).reduce((acc, [category, scores]) => {
        acc[category] = this.calculateTrend(scores);
        return acc;
      }, {} as Record<string, 'improving' | 'stable' | 'declining'>),
      recommendations: this.generateTrendRecommendations(trends)
    };
  }

  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';
    
    const recent = scores.slice(-3);
    const older = scores.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  private generateTrendRecommendations(trends: any): string[] {
    const recommendations: string[] = [];
    
    // Analyze overall trend
    const overallTrend = this.calculateTrend(trends.scores);
    if (overallTrend === 'declining') {
      recommendations.push('Address declining validation scores immediately');
    }
    
    // Analyze category trends
    Object.entries(trends.categories).forEach(([category, scores]) => {
      const trend = this.calculateTrend(scores as number[]);
      if (trend === 'declining') {
        recommendations.push(`Focus on improving ${category} validation scores`);
      }
    });
    
    return recommendations;
  }
}
```

### 5. Integration with EnhancedProjectEditForm

#### Using Enhanced Validation Step

```typescript
import { EnhancedProjectEditForm } from '@/components/project/EnhancedProjectEditForm';

function ProjectManagement() {
  const [projectData, setProjectData] = useState({
    id: 'project-123',
    title: 'Sample Project',
    // ... other project data
  });

  const handleSubmit = async (data: ProjectWorkflowData) => {
    try {
      // Save project with enhanced validation
      console.log('Saving project with validation data:', data);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  return (
    <EnhancedProjectEditForm
      initialData={projectData}
      onSubmit={handleSubmit}
      isSubmitting={false}
    />
  );
}
```

## Advanced Features

### 1. Validation Workflow Automation

```typescript
class ValidationWorkflowAutomation {
  async scheduleAutomaticValidations(projectId: string) {
    const project = await RepositoryFactory.getProjectRepository().findById(projectId);
    
    // Schedule validations based on project phase
    const validationSchedule = [
      { phase: 'planning', category: 'technical', frequency: 'weekly' },
      { phase: 'execution', category: 'safety', frequency: 'daily' },
      { phase: 'completion', category: 'reception', frequency: 'once' }
    ];

    for (const schedule of validationSchedule) {
      if (project.phase === schedule.phase) {
        await this.scheduleValidation(projectId, schedule.category, schedule.frequency);
      }
    }
  }

  private async scheduleValidation(projectId: string, category: string, frequency: string) {
    // Implementation for scheduling validations
    console.log(`Scheduling ${category} validation for project ${projectId} with frequency ${frequency}`);
  }
}
```

### 2. Risk-Compliance Correlation

```typescript
class RiskComplianceAnalyzer {
  async analyzeRiskComplianceCorrelation(projectId: string) {
    const [risks, complianceItems] = await Promise.all([
      RepositoryFactory.getRiskRepository().findByProjectId(projectId),
      RepositoryFactory.getComplianceRepository().findByProjectId(projectId)
    ]);

    const correlations = this.findCorrelations(risks, complianceItems);
    
    return {
      highRiskNonCompliant: correlations.filter(c => c.riskLevel === 'high' && c.complianceStatus !== 'approved'),
      recommendations: this.generateCorrelationRecommendations(correlations),
      riskMitigationImpact: this.calculateMitigationImpact(correlations)
    };
  }

  private findCorrelations(risks: RiskDTO[], complianceItems: ComplianceItemDTO[]) {
    // Implementation for finding correlations between risks and compliance
    return [];
  }

  private generateCorrelationRecommendations(correlations: any[]): string[] {
    // Implementation for generating recommendations based on correlations
    return [];
  }

  private calculateMitigationImpact(correlations: any[]): number {
    // Implementation for calculating impact of risk mitigation on compliance
    return 0;
  }
}
```

## Best Practices

### 1. Service Initialization

- Always initialize services with proper repositories
- Use RepositoryFactory for consistent repository access
- Handle service initialization errors gracefully

### 2. Error Handling

- Implement comprehensive error handling
- Use try-catch blocks for async operations
- Provide meaningful error messages to users

### 3. Performance Optimization

- Use React Query for data caching
- Implement pagination for large datasets
- Batch operations when possible

### 4. Data Validation

- Validate input data before service calls
- Use DTOs for type safety
- Implement client-side validation for better UX

### 5. Testing

- Write comprehensive unit tests for services
- Use integration tests for workflow validation
- Mock external dependencies for testing

## Troubleshooting

### Common Issues

1. **Service Initialization Errors**
   - Check repository availability
   - Verify database connections
   - Ensure proper configuration

2. **Validation Failures**
   - Review validation rules
   - Check data completeness
   - Verify user permissions

3. **Performance Issues**
   - Optimize database queries
   - Implement caching strategies
   - Use pagination for large datasets

### Debugging Tips

- Use browser dev tools for network requests
- Check console logs for error details
- Verify service responses with proper logging
- Use TypeScript strict mode for better error detection

## API Reference

### ReceptionService

```typescript
class ReceptionService {
  async createProvisionalReception(projectId: string, phaseId: string, data: CreateProvisionalReceptionData): Promise<ReceptionDTO>
  async createDefinitiveReception(projectId: string, data: CreateDefinitiveReceptionData): Promise<ReceptionDTO>
  async approveProvisionalReception(receptionId: string, data: ApproveReceptionData): Promise<ReceptionDTO>
  async approveDefinitiveReception(receptionId: string, data: ApproveReceptionData): Promise<ReceptionDTO>
  async getReceptionWorkflow(projectId: string): Promise<ReceptionWorkflowDTO>
  async validateReception(receptionId: string): Promise<ReceptionValidationDTO>
}
```

### EnhancedValidationService

```typescript
class EnhancedValidationService {
  async validateProjectComplete(projectId: string, validatedBy: string): Promise<EnhancedValidationResult>
  async getValidationHistory(projectId: string): Promise<EnhancedValidationResult[]>
  async getValidationTrends(projectId: string, months: number): Promise<ValidationTrends>
}
```

### RiskService

```typescript
class RiskService {
  async createRisk(data: CreateRiskDTO): Promise<RiskDTO>
  async updateRisk(id: string, data: UpdateRiskDTO): Promise<RiskDTO>
  async deleteRisk(id: string): Promise<void>
  async getRisksByProject(projectId: string): Promise<RiskDTO[]>
  async getRiskById(id: string): Promise<RiskDTO | null>
}
```

### ComplianceService

```typescript
class ComplianceService {
  async createComplianceItem(data: CreateComplianceItemDTO): Promise<ComplianceItemDTO>
  async updateComplianceItem(id: string, data: UpdateComplianceItemDTO): Promise<ComplianceItemDTO>
  async deleteComplianceItem(id: string): Promise<void>
  async getComplianceByProject(projectId: string): Promise<ComplianceItemDTO[]>
  async getComplianceById(id: string): Promise<ComplianceItemDTO | null>
}
```

## Conclusion

The enhanced validation system provides a comprehensive solution for managing project validation workflows with strict adherence to hexagonal architecture principles. By following this guide, you can effectively implement and utilize the enhanced validation features for improved project management and compliance tracking.

For more information, refer to the individual service documentation and API references.
