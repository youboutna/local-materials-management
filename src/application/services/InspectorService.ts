/**
 * Inspector Service
 * Implements business logic for inspector management and selection
 */

import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { Employee } from '@/domain/entities/Employee';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface Inspector {
  id: string;
  name: string;
  type: 'employee' | 'supplier';
  position?: string;
  role?: string;
}

export interface SearchInspectorsOptions {
  projectId?: string;
  includeEmployees?: boolean;
  includeSuppliers?: boolean;
  activeOnly?: boolean;
}

export class InspectorService {
  constructor(
    private employeeRepository: IEmployeeRepository,
    private supplierRepository: ISupplierRepository,
    private projectStakeholderRepository: IProjectStakeholderRepository
  ) {}

  /**
   * Get inspectors for a specific project or all inspectors
   */
  async getInspectors(options: SearchInspectorsOptions = {}): Promise<Inspector[]> {
    try {
      const inspectorsList: Inspector[] = [];

      if (options.projectId) {
        // Get project-specific inspectors from stakeholders
        const stakeholders = await this.projectStakeholderRepository.findByProjectId(options.projectId);
        
        for (const stakeholder of stakeholders) {
          if (stakeholder.employeeId) {
            const employee = await this.employeeRepository.findById(stakeholder.employeeId);
            if (employee && employee.isActive) {
              inspectorsList.push({
                id: employee.id,
                name: employee.fullName || '',
                type: 'employee',
                position: employee.position || undefined,
                role: stakeholder.roleDescription || stakeholder.stakeholderType
              });
            }
          } else if (stakeholder.supplierId) {
            const supplier = await this.supplierRepository.findById(stakeholder.supplierId);
            if (supplier && supplier.isActive()) {
              inspectorsList.push({
                id: supplier.id,
                name: supplier.contacts[0]?.name || supplier.name,
                type: 'supplier',
                position: `Bureau d'études - ${supplier.name}`,
                role: stakeholder.roleDescription || stakeholder.stakeholderType
              });
            }
          }
        }
      } else {
        // Get all available inspectors
        if (options.includeEmployees !== false) {
          const employees = options.activeOnly !== false 
            ? await this.employeeRepository.findActive()
            : await this.employeeRepository.findAll();
          
          employees.forEach(emp => {
            inspectorsList.push({
              id: emp.id,
              name: emp.fullName || '',
              type: 'employee',
              position: emp.position || undefined
            });
          });
        }

        if (options.includeSuppliers !== false) {
          const suppliers = await this.supplierRepository.findAll();
          const activeSuppliers = options.activeOnly !== false 
            ? suppliers.filter(s => s.isActive())
            : suppliers;
          
          activeSuppliers.forEach(sup => {
            inspectorsList.push({
              id: sup.id,
              name: sup.contacts[0]?.name || sup.name,
              type: 'supplier',
              position: `Bureau d'études - ${sup.name}`
            });
          });
        }
      }

      return inspectorsList;
    } catch (error) {
      console.error('InspectorService.getInspectors failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspectors');
    }
  }

  /**
   * Get inspector by ID
   */
  async getInspectorById(id: string, type: 'employee' | 'supplier'): Promise<Inspector | null> {
    try {
      if (type === 'employee') {
        const employee = await this.employeeRepository.findById(id);
        if (!employee || !employee.isActive) return null;
        
        return {
          id: employee.id,
          name: employee.fullName || '',
          type: 'employee',
          position: employee.position || undefined
        };
      } else {
        const supplier = await this.supplierRepository.findById(id);
        if (!supplier || !supplier.isActive()) return null;
        
        return {
          id: supplier.id,
          name: supplier.contacts[0]?.name || supplier.name,
          type: 'supplier',
          position: `Bureau d'études - ${supplier.name}`
        };
      }
    } catch (error) {
      console.error('InspectorService.getInspectorById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspector');
    }
  }
}
