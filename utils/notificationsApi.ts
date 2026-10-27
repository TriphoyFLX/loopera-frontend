import { tokenStorage } from './tokenStorage';
import { getApiBaseUrl } from './urls';
import { apiFetch, parseApiJson } from './http';

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
  author_name?: string | null;
  kind?: string | null;
  link?: string | null;
};

export type AdminNotification = {
  id: number;
  title: string;
  body: string;
  created_at: string;
  is_active: boolean;
  author_name?: string | null;
  reads_count?: number;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStorage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

class NotificationsApi {
  async list(limit = 30): Promise<{ notifications: AppNotification[] }> {
    const response = await apiFetch(`${getApiBaseUrl()}/notifications?limit=${limit}`, {
      headers: authHeaders(),
    });
    return parseApiJson(response);
  }

  async unreadCount(): Promise<number> {
    const token = tokenStorage.getToken();
    if (!token) return 0;
    const response = await apiFetch(`${getApiBaseUrl()}/notifications/unread-count`, {
      headers: authHeaders(),
    });
    const data = await parseApiJson<{ count: number }>(response);
    return data.count || 0;
  }

  async markRead(id: number): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/notifications/${id}/read`, {
      method: 'POST',
      headers: authHeaders(),
    });
    await parseApiJson(response);
  }

  async markAllRead(): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/notifications/read-all`, {
      method: 'POST',
      headers: authHeaders(),
    });
    await parseApiJson(response);
  }

  async adminList(): Promise<{ notifications: AdminNotification[] }> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/notifications`, {
      headers: authHeaders(),
    });
    return parseApiJson(response);
  }

  async create(title: string, body: string): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/notifications`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, body }),
    });
    await parseApiJson(response);
  }

  async remove(id: number): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await parseApiJson(response);
  }
}

export const notificationsApi = new NotificationsApi();
