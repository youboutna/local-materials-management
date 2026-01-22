/**
 * Supplier Portal Service
 * Business logic for supplier portal operations
 */

import { ISupplierRepository } from '@/domain/repositories';
import { Supplier, SupplierCategory, SupplierStatus } from '@/domain/entities/Supplier';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export class SupplierPortalService {
  constructor(
    private supplierRepository: ISupplierRepository
  ) {}

  async getSupplierProfile(userId: string): Promise<Supplier | null> {
    try {
      // Try to find by user_id in contacts
      const suppliers = await this.supplierRepository.findAll();
      return suppliers.find(supplier => 
        supplier.contacts.some(contact => contact.email === userId)
      ) || null;
    } catch (error) {
      console.error('Error getting supplier profile:', error);
      throw error;
    }
  }

  async updateSupplierProfile(supplierId: string, updates: Partial<Supplier>): Promise<Supplier> {
    await this.supplierRepository.update(supplierId, updates);
    const updated = await this.supplierRepository.findById(supplierId);
    if (!updated) {
      throw new Error('Supplier not found after update');
    }
    return updated;
  }

  async getSupplierDocuments(userId: string): Promise<any[]> {
    try {
      // Use document repository to get supplier documents
      const documentRepository = RepositoryFactory.getDocumentRepository();
      const documents = await documentRepository.findBySupplierId(userId);
      
      return documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        documentType: doc.documentType,
        uploadedAt: doc.createdAt
      }));
    } catch (error) {
      console.error('Error getting supplier documents:', error);
      throw error;
    }
  }

  async getSupplierTasks(userId: string): Promise<any[]> {
    try {
      // Use task repository to get supplier tasks
      const taskRepository = RepositoryFactory.getTaskRepository();
      const tasks = await taskRepository.findByAssigneeId(userId);
      
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt
      }));
    } catch (error) {
      console.error('Error getting supplier tasks:', error);
      throw error;
    }
  }

  async getSupplierNotifications(supplierId: string): Promise<any[]> {
    try {
      // Use notification repository to get supplier notifications
      const notificationRepository = RepositoryFactory.getNotificationRepository();
      const notifications = await notificationRepository.findByRecipientId(supplierId);
      
      return notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt
      }));
    } catch (error) {
      console.error('Error getting supplier notifications:', error);
      throw error;
    }
  }

  async getSupplierPaymentRequests(supplierId: string): Promise<any[]> {
    try {
      // Use payment repository to get supplier payment requests
      const paymentRepository = RepositoryFactory.getPaymentRepository();
      const payments = await paymentRepository.findBySupplierId(supplierId);
      
      return payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        requestDate: payment.requestDate,
        description: payment.description,
        projectId: payment.projectId
      }));
    } catch (error) {
      console.error('Error getting supplier payment requests:', error);
      throw error;
    }
  }

  async getSupplierInvoices(supplierName: string): Promise<any[]> {
    try {
      // Use invoice repository to get supplier invoices
      const invoiceRepository = RepositoryFactory.getInvoiceRepository();
      const invoices = await invoiceRepository.findBySupplierName(supplierName);
      
      return invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        projectName: invoice.projectName
      }));
    } catch (error) {
      console.error('Error getting supplier invoices:', error);
      throw error;
    }
  }

  async uploadDocument(userId: string, file: File, title: string): Promise<any> {
    try {
      // Use storage repository to upload document
      const storageRepository = RepositoryFactory.getStorageRepository();
      const documentRepository = RepositoryFactory.getDocumentRepository();
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `supplier-documents/${userId}/${fileName}`;
      
      // Upload file
      const fileUrl = await storageRepository.uploadFile(filePath, file);
      
      // Save document metadata
      const document = await documentRepository.save({
        id: crypto.randomUUID(),
        title,
        description: `Document uploaded by supplier`,
        fileUrl,
        fileSize: file.size,
        documentType: file.type,
        supplierId: userId,
        uploadedBy: userId,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, id: document.id };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async addTaskComment(taskId: string, comment: string): Promise<void> {
    try {
      // Use task repository to add comment
      const taskRepository = RepositoryFactory.getTaskRepository();
      const authRepository = RepositoryFactory.getAuthRepository();
      
      const user = await authRepository.getCurrentUser();
      
      await taskRepository.addComment(taskId, {
        id: crypto.randomUUID(),
        taskId,
        comment,
        authorId: user?.id || 'system',
        authorName: user?.email || 'System',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding task comment:', error);
      throw error;
    }
  }

  async completeTask(taskId: string, projectManagerId: string): Promise<void> {
    try {
      // Use task repository to complete task
      const taskRepository = RepositoryFactory.getTaskRepository();
      const notificationRepository = RepositoryFactory.getNotificationRepository();
      
      // Update task status
      await taskRepository.update(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      // Create notification for project manager
      await notificationRepository.create({
        id: crypto.randomUUID(),
        recipientId: projectManagerId,
        title: 'Task Completed',
        message: `Task ${taskId} has been marked as completed`,
        type: 'task_completed',
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  async createNotification(data: {
    supplierId: string;
    taskId: string;
    email: string;
    comment: string;
    notificationType: 'task_comment' | 'task_completed';
  }): Promise<void> {
    try {
      // Use notification repository to create notification
      const notificationRepository = RepositoryFactory.getNotificationRepository();
      
      await notificationRepository.create({
        id: crypto.randomUUID(),
        recipientId: data.supplierId,
        title: data.notificationType === 'task_comment' ? 'New Comment' : 'Task Completed',
        message: data.comment,
        type: data.notificationType,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static create(): SupplierPortalService {
    return new SupplierPortalService(RepositoryFactory.getSupplierRepository());
  }
}
