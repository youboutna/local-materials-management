// @ts-nocheck
/**
 * LocalStorage Inspection Payment Validation Adapter
 * Implements IInspectionPaymentValidationRepository using LocalStorage for DEV_MODE
 */

import { 
  IInspectionPaymentValidationRepository, 
  PaymentRequest, 
  ProjectDetails, 
  InspectionDetails 
} from '@/domain/repositories/IInspectionPaymentValidationRepository';

// Mock data for development
const mockInspections = [
  {
    id: 'inspection-1',
    status: 'approved',
    comments: 'Inspection completed successfully',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'inspection-2', 
    status: 'pending',
    comments: 'Inspection in progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockPaymentRequests = [
  {
    id: 'payment-1',
    inspection_id: 'inspection-1',
    status: 'pending',
    amount: 1500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project Alpha',
    description: 'Test project for development',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    project_stakeholders: [
      {
        stakeholder_type: 'supplier',
        stakeholder_entity_type: 'company',
        supplier_id: 'supplier-1',
        employee_id: null,
        suppliers: {
          id: 'supplier-1',
          name: 'Test Supplier',
          contact_person: 'John Doe',
          phone: '+1234567890',
          email: 'test@supplier.com'
        }
      }
    ]
  }
];

export class LocalStorageInspectionPaymentValidationAdapter implements IInspectionPaymentValidationRepository {
  // ============= Inspection Queries =============

  async getInspectionWithPaymentRequest(inspectionId: string): Promise<InspectionDetails | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get inspection from mock data
    const inspectionData = mockInspections.find(inspection => inspection.id === inspectionId);
    
    if (!inspectionData) {
      return null;
    }
    
    // Check if inspection is approved
    if (inspectionData?.status !== 'approved') {
      return null;
    }
    
    // Check if there's a pending payment request linked to this inspection
    const paymentRequest = mockPaymentRequests.find(
      payment => payment.inspection_id === inspectionId && payment.status === 'pending'
    );
    
    // Only return inspection if it has a pending payment request
    if (!paymentRequest) {
      return null;
    }
    
    return inspectionData as InspectionDetails;
  }

  async getProjectWithStakeholders(projectId: string): Promise<ProjectDetails | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectData = mockProjects.find(project => project.id === projectId);
    
    if (!projectData) {
      return null;
    }
    
    return projectData as ProjectDetails;
  }

  async updateInspectionStatus(inspectionId: string, status: string, comments: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find inspection in mock data
    const inspectionIndex = mockInspections.findIndex(inspection => inspection.id === inspectionId);
    
    if (inspectionIndex === -1) {
      throw new Error(`Inspection with id ${inspectionId} not found`);
    }
    
    // Update inspection
    mockInspections[inspectionIndex] = {
      ...mockInspections[inspectionIndex],
      status,
      comments,
      updated_at: new Date().toISOString()
    };
    
    // Persist to localStorage
    localStorage.setItem('dev_inspections', JSON.stringify(mockInspections));
    
    console.log(`[DEV_MODE] Updated inspection ${inspectionId} status to ${status}`);
  }

  async createPaymentRequest(paymentRequestData: Omit<PaymentRequest, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentRequest> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newPaymentRequest: PaymentRequest = {
      ...paymentRequestData,
      id: `payment-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to mock data
    mockPaymentRequests.push(newPaymentRequest);
    
    // Persist to localStorage
    localStorage.setItem('dev_payment_requests', JSON.stringify(mockPaymentRequests));
    
    console.log(`[DEV_MODE] Created payment request ${newPaymentRequest.id}`);
    
    return newPaymentRequest;
  }

  async updatePaymentRequestStatus(paymentRequestId: string, status: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find payment request in mock data
    const paymentIndex = mockPaymentRequests.findIndex(payment => payment.id === paymentRequestId);
    
    if (paymentIndex === -1) {
      throw new Error(`Payment request with id ${paymentRequestId} not found`);
    }
    
    // Update payment request
    mockPaymentRequests[paymentIndex] = {
      ...mockPaymentRequests[paymentIndex],
      status,
      updated_at: new Date().toISOString()
    };
    
    // Persist to localStorage
    localStorage.setItem('dev_payment_requests', JSON.stringify(mockPaymentRequests));
    
    console.log(`[DEV_MODE] Updated payment request ${paymentRequestId} status to ${status}`);
  }

  // ============= Utility Methods =============

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    // Initialize inspections
    if (!localStorage.getItem('dev_inspections')) {
      localStorage.setItem('dev_inspections', JSON.stringify(mockInspections));
    }
    
    // Initialize payment requests
    if (!localStorage.getItem('dev_payment_requests')) {
      localStorage.setItem('dev_payment_requests', JSON.stringify(mockPaymentRequests));
    }
    
    // Initialize projects
    if (!localStorage.getItem('dev_projects')) {
      localStorage.setItem('dev_projects', JSON.stringify(mockProjects));
    }
    
    console.log('[DEV_MODE] LocalStorage initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_inspections');
    localStorage.removeItem('dev_payment_requests');
    localStorage.removeItem('dev_projects');
    
    console.log('[DEV_MODE] LocalStorage cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData() {
    if (typeof window === 'undefined') return null;
    
    return {
      inspections: JSON.parse(localStorage.getItem('dev_inspections') || '[]'),
      paymentRequests: JSON.parse(localStorage.getItem('dev_payment_requests') || '[]'),
      projects: JSON.parse(localStorage.getItem('dev_projects') || '[]')
    };
  }
}
