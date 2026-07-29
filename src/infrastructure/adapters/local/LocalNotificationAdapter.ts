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
    recipient_id: u.id ?? `dev-user-${i}`,
    title: 'Bienvenue',
    message: `Session locale de démonstration pour ${u.email ?? u.full_name ?? 'utilisateur'}.`,
    type: 'info',
    read: false,
    priority: 'low',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    notification: Omit<NotificationData, 'id' | 'created_at' | 'updated_at'>
  ) {
    const list = load();
    const now = new Date().toISOString();
    const created: NotificationData = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: now,
      updated_at: now,
    };
    list.unshift(created);
    save(list);
    return { notification: created, error: null };
  }

  async getUserNotifications(userId: string, limit = 50) {
    const list = load().filter((n) => n.recipient_id === userId).slice(0, limit);
    return { notifications: list, error: null };
  }

  async markAsRead(notificationId: string) {
    const list = load();
    const idx = list.findIndex((n) => n.id === notificationId);
    if (idx >= 0) {
      list[idx].read = true;
      list[idx].updated_at = new Date().toISOString();
      save(list);
    }
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
    const count = load().filter((n) => n.recipient_id === userId && !n.read).length;
    return { count, error: null };
  }

  async getSystemNotifications(limit = 100) {
    const list = load().filter((n) => n.type === 'system').slice(0, limit);
    return { notifications: list, error: null };
  }
}
