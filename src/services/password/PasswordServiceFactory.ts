
import { IPasswordService } from '@/interfaces/IPasswordService';
import { SupabasePasswordService } from './SupabasePasswordService';

export class PasswordServiceFactory {
  private static instance: IPasswordService;

  static getInstance(): IPasswordService {
    if (!this.instance) {
      // In the future, you could switch providers based on configuration
      this.instance = new SupabasePasswordService();
    }
    return this.instance;
  }

  static setInstance(service: IPasswordService): void {
    this.instance = service;
  }
}
