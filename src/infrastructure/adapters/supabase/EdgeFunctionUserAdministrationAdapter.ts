import type {
  ConfirmationChannel,
  ConfirmationResult,
  CreateManagedUserCommand,
  IUserAdministrationGateway,
  ManagedUserResult,
  UpdateManagedUserCommand,
} from '@/domain/repositories/IUserAdministrationGateway';
import { notificationGatewayAdapter } from './NotificationGatewayAdapter';

interface AdminUsersResponse {
  success?: boolean;
  userId?: string;
  error?: string;
  confirmation?: ConfirmationResult;
}

/** Adapter : délègue au serveur `admin-users` (clé de service jamais exposée). */
export class EdgeFunctionUserAdministrationAdapter implements IUserAdministrationGateway {
  private async call(body: Record<string, unknown>): Promise<AdminUsersResponse> {
    const { data, error } = await notificationGatewayAdapter.invokeFunction<AdminUsersResponse>('admin-users', body);
    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'USER_ADMIN_GATEWAY_FAILED');
    }
    return data;
  }

  async create(command: CreateManagedUserCommand): Promise<ManagedUserResult> {
    const data = await this.call({ action: 'create', ...command });
    return { userId: data.userId as string, confirmation: data.confirmation };
  }

  async update(command: UpdateManagedUserCommand): Promise<ManagedUserResult> {
    const data = await this.call({ action: 'update', ...command });
    return { userId: data.userId as string };
  }

  async setActive(userId: string, isActive: boolean): Promise<ManagedUserResult> {
    await this.call({ action: 'set_active', userId, isActive });
    return { userId };
  }

  async remove(userId: string): Promise<ManagedUserResult> {
    await this.call({ action: 'delete', userId });
    return { userId };
  }

  async resendConfirmation(userId: string, channel: ConfirmationChannel, redirectTo: string): Promise<ConfirmationResult> {
    const data = await this.call({ action: 'resend_confirmation', userId, channel, redirectTo });
    return data.confirmation ?? { channel, sent: true };
  }
}
