/**
 * Simple Inspector Service
 * Implements business logic for inspector management
 * Following hexagonal architecture principles
 */

import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Employee } from '@/domain/entities/Employee';
import { Supplier } from '@/domain/entities/Supplier';

export interface Inspector {
  id: string;
  name: string;
  type: 'employee' | 'supplier';
  position?: string;
  role?: string;
}

export class InspectorService {
  constructor(
    private employeeRepository: IEmployeeRepository,
    private supplierRepository: ISupplierRepository
  ) {}

  /**
   * Get all available inspectors (employees and suppliers)
   */
  async getInspectors(): Promise<Inspector[]> {
    try {
      const inspectorsList: Inspector[] = [];

      // Get active employees
      const employees = await this.employeeRepository.findAll();
      employees.forEach(emp => {
        if (emp.isActive) {
          inspectorsList.push({
            id: emp.id,
            name: emp.fullName,
            type: 'employee',
            position: emp.position || undefined
          });
        }
      });

      // Get active suppliers
      const suppliers = await this.supplierRepository.findAll();
      suppliers.forEach(sup => {
        if (sup.isActive()) {
          inspectorsList.push({
            id: sup.id,
            name: sup.contacts[0]?.name || sup.name,
            type: 'supplier',
            position: `Bureau d'études - ${sup.name}`
          });
        }
      });

      return inspectorsList;
    } catch (error) {
      console.error('InspectorService.getInspectors failed:', error);
      throw error;
    }
  }

  /**
   * Get inspector by ID and type
   */
  async getInspectorById(id: string, type: 'employee' | 'supplier'): Promise<Inspector | null> {
    try {
      if (type === 'employee') {
        const employee = await this.employeeRepository.findById(id);
        if (!employee || !employee.isActive) return null;
        
        return {
          id: employee.id,
          name: employee.fullName,
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
      throw error;
    }
  }
}
