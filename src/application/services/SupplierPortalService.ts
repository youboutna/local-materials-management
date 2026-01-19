/**
 * Supplier Portal Service
 * Business logic for supplier portal operations
 */

import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { ISupplierRepository } from '@/domain/repositories';

export class SupplierPortalService {
  constructor(
    private supplierRepository: ISupplierRepository
  ) {}

  async login(email: string, password: string): Promise<SupplierDTO | null> {
    // Business logic for supplier login
    return await this.supplierRepository.findByEmail(email);
  }

  async signUp(email: string, password: string): Promise<SupplierDTO> {
    // Business logic for supplier registration
    return await this.supplierRepository.create({
      email,
      password,
      status: 'pending'
    });
  }

  async logout(): Promise<void> {
    // Business logic for logout
    // This would typically be handled by auth service
  }

  async getSupplierProfile(userId: string): Promise<SupplierDTO | null> {
    return await this.supplierRepository.findByUserId(userId);
  }

  async getSupplierDocuments(userId: string): Promise<any[]> {
    return await this.supplierRepository.findDocumentsByUserId(userId);
  }

  async getSupplierTasks(userId: string): Promise<any[]> {
    return await this.supplierRepository.findTasksByUserId(userId);
  }

  async getSupplierNotifications(supplierId: string): Promise<any[]> {
    return await this.supplierRepository.findNotificationsBySupplierId(supplierId);
  }

  async getSupplierPaymentRequests(supplierId: string): Promise<any[]> {
    return await this.supplierRepository.findPaymentRequestsBySupplierId(supplierId);
  }

  async getSupplierInvoices(supplierName: string): Promise<any[]> {
    return await this.supplierRepository.findInvoicesBySupplierName(supplierName);
  }

  async uploadDocument(userId: string, file: File, title: string): Promise<any> {
    // Business logic for document upload
    return await this.supplierRepository.uploadDocument(userId, file, title);
  }

  async addTaskComment(taskId: string, comment: string): Promise<void> {
    return await this.supplierRepository.addTaskComment(taskId, comment);
  }

  async completeTask(taskId: string, projectManagerId: string): Promise<void> {
    return await this.supplierRepository.completeTask(taskId, projectManagerId);
  }
}
