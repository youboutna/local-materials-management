/**
 * LocalNotificationAdapter
 * In-memory notifications for DEV_MODE. Seeded from DEV_USERS.
 */
import {
  INotificationRepository,
  NotificationData,
  EmailData,
  SMSData,
  CallData,
} from '@/domain/repositories/INotificationRepository';
import { DEV_USERS } from '@/config/constants';

const STORAGE_KEY = 'dev_notifications';

function load(): NotificationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: NotificationData[] = Object.values(DEV_USERS ?? {}).map((u: any, i) => ({
    id: `dev-notif-${i + 1}`,
    recipientId: u.id ?? `dev-user-${i}`,
    title: 'Bienvenue',
    message: `Session locale de démonstration pour ${u.email ?? u.full_name ?? 'utilisateur'}.`,
    type: 'info',
    read: false,
    priority: 'low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { source: 'LocalNotificationAdapter' },
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {}
  return seed;
}

function save(list: NotificationData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export class LocalNotificationAdapter implements INotificationRepository {
  async createNotification(
    notification: Omit<NotificationData, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const list = load();
    const now = new Date().toISOString();
    const created: NotificationData = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(created);
    save(list);
    return { notification: created, error: null };
  }

  async getUserNotifications(userId: string, limit = 50) {
    const list = load().filter((n) => n.recipientId === userId).slice(0, limit);
    return { notifications: list, error: null };
  }

  async getNotificationById(notificationId: string) {
    const found = load().find((n) => n.id === notificationId) ?? null;
    return { notification: found, error: null };
  }

  async updateNotification(
    notificationId: string,
    patch: Partial<Omit<NotificationData, 'id' | 'createdAt'>>
  ) {
    const list = load();
    const idx = list.findIndex((n) => n.id === notificationId);
    if (idx < 0) return { notification: null, error: new Error('Notification not found') };
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    save(list);
    return { notification: list[idx], error: null };
  }

  async markAsRead(notificationId: string) {
    return (await this.updateNotification(notificationId, { read: true })).error
      ? { error: new Error('Notification not found') }
      : { error: null };
  }

  async markAsUnread(notificationId: string) {
    return (await this.updateNotification(notificationId, { read: false })).error
      ? { error: new Error('Notification not found') }
      : { error: null };
  }

  async markAllAsRead(userId: string) {
    const now = new Date().toISOString();
    save(
      load().map((n) =>
        n.recipientId === userId && !n.read ? { ...n, read: true, updatedAt: now } : n
      )
    );
    return { error: null };
  }

  async deleteNotification(notificationId: string) {
    save(load().filter((n) => n.id !== notificationId));
    return { error: null };
  }

  async sendEmail(_data: EmailData) {
    console.info('[LocalNotificationAdapter] email (dev)', _data);
    return { error: null };
  }
  async sendSMS(_data: SMSData) {
    console.info('[LocalNotificationAdapter] sms (dev)', _data);
    return { error: null };
  }
  async scheduleCall(_data: CallData) {
    console.info('[LocalNotificationAdapter] call (dev)', _data);
    return { error: null };
  }
  async getUnreadCount(userId: string) {
    const count = load().filter((n) => n.recipientId === userId && !n.read).length;
    return { count, error: null };
  }

  async getSystemNotifications(limit = 100) {
    const list = load().filter((n) => n.type === 'system').slice(0, limit);
    return { notifications: list, error: null };
  }
}
