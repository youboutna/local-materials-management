/**
 * Port d'administration des comptes (création avec lien de confirmation,
 * modification, activation, rôles, suppression). L'implémentation s'exécute
 * côté serveur : le navigateur ne détient jamais de privilège administrateur.
 */
export type ConfirmationChannel = 'email' | 'sms';

export interface CreateManagedUserCommand {
  email: string;
  fullName: string;
  phone: string | null;
  nationalId: string | null;
  roles: string[];
  channel: ConfirmationChannel;
  redirectTo: string;
}

export interface UpdateManagedUserCommand {
  userId: string;
  email?: string;
  fullName?: string;
  phone?: string | null;
  nationalId?: string | null;
  password?: string;
  roles?: string[];
}

export interface ConfirmationResult {
  channel: ConfirmationChannel;
  sent: boolean;
  error?: string;
}

export interface ManagedUserResult {
  userId: string;
  confirmation?: ConfirmationResult;
}

export interface IUserAdministrationGateway {
  create(command: CreateManagedUserCommand): Promise<ManagedUserResult>;
  update(command: UpdateManagedUserCommand): Promise<ManagedUserResult>;
  setActive(userId: string, isActive: boolean): Promise<ManagedUserResult>;
  remove(userId: string): Promise<ManagedUserResult>;
  resendConfirmation(userId: string, channel: ConfirmationChannel, redirectTo: string): Promise<ConfirmationResult>;
}
