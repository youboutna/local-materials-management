/**
 * Supplier Portal Service
 * Business logic for supplier portal operations
 */

import { ISupplierRepository } from '@/domain/repositories';
import { Supplier } from '@/domain/entities/Supplier';
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
      const tasks = await taskRepository.findByAssignee(userId);
      
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
      const { notifications } = await notificationRepository.getUserNotifications(supplierId);
      
      return notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.created_at
      }));
    } catch (error) {
      console.error('Error getting supplier notifications:', error);
      throw error;
    }
  }

  async getSupplierPaymentRequests(supplierId: string): Promise<any[]> {
    try {
      // Use payment repository to get supplier payment requests by contractor name
      const paymentRepository = RepositoryFactory.getPaymentRepository();
      const payments = await paymentRepository.findByContractor(supplierId);
      
      return payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        requestDate: payment.paymentDate,
        projectId: payment.project?.id || ''
      }));
    } catch (error) {
      console.error('Error getting supplier payment requests:', error);
      throw error;
    }
  }

  async getSupplierInvoices(supplierName: string): Promise<any[]> {
    try {
      // Use parsed invoice repository to get supplier invoices
      const invoiceRepository = RepositoryFactory.getParsedInvoiceRepository();
      const invoices = await invoiceRepository.findAll();
      
      // Filter by supplier name if available in extractedData
      const supplierInvoices = invoices.filter(inv => {
        const extractedData = inv.extractedData as any;
        const supplierInfo = extractedData?.supplier || {};
        return supplierInfo?.name?.toLowerCase().includes(supplierName.toLowerCase()) ||
               inv.supplierId === supplierName;
      });
      
      return supplierInvoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        issueDate: invoice.invoiceDate,
        projectName: invoice.tenderId
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
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `supplier-documents/${userId}/${fileName}`;
      
      // Upload file
      const { result, error } = await storageRepository.uploadFile('documents', filePath, file);
      
      if (error || !result) {
        throw error || new Error('Upload failed');
      }
      
      // Return success with generated document ID
      return { success: true, id: crypto.randomUUID(), url: result.publicUrl };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async addTaskComment(taskId: string, comment: string): Promise<void> {
    try {
      // Use task repository to update task with comment in description
      const taskRepository = RepositoryFactory.getTaskRepository();
      const authRepository = RepositoryFactory.getAuthRepository();
      
      const authResult = await authRepository.getCurrentUser();
      const userId = authResult?.user?.id || 'system';
      
      const task = await taskRepository.findById(taskId);
      if (task) {
        const newDescription = `${task.description}\n\n[Comment by ${userId}]: ${comment}`;
        await taskRepository.update(taskId, { description: newDescription });
      }
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
        status: 'completed'
      });
      
      // Create notification for project manager
      await notificationRepository.createNotification({
        recipient_id: projectManagerId,
        title: 'Task Completed',
        message: `Task ${taskId} has been marked as completed`,
        type: 'success',
        read: false
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
      
      await notificationRepository.createNotification({
        recipient_id: data.supplierId,
        title: data.notificationType === 'task_comment' ? 'New Comment' : 'Task Completed',
        message: data.comment,
        type: 'info',
        read: false
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
