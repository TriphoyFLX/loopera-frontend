import { tokenStorage } from './tokenStorage';
import { getApiBaseUrl } from './urls';
import { apiFetch, parseApiJson } from './http';

export type FollowUser = {
  id: number;
  username: string;
  avatar_url?: string | null;
  hashtag?: string | null;
  followed_at?: string;
  loops_count?: number;
};

export type FollowStatus = {
  user: { id: number; username: string };
  following: boolean;
  is_self?: boolean;
  followers_count: number;
  following_count: number;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStorage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

class FollowsApi {
  async getStatus(usernameOrId: string): Promise<FollowStatus> {
    const response = await apiFetch(
      `${getApiBaseUrl()}/follows/status/${encodeURIComponent(usernameOrId)}`,
      { headers: authHeaders() },
    );
    return parseApiJson(response);
  }

  async follow(usernameOrId: string): Promise<FollowStatus & { following: true }> {
    const response = await apiFetch(
      `${getApiBaseUrl()}/follows/${encodeURIComponent(usernameOrId)}`,
      { method: 'POST', headers: authHeaders() },
    );
    return parseApiJson(response);
  }

  async unfollow(usernameOrId: string): Promise<FollowStatus & { following: false }> {
    const response = await apiFetch(
      `${getApiBaseUrl()}/follows/${encodeURIComponent(usernameOrId)}`,
      { method: 'DELETE', headers: authHeaders() },
    );
    return parseApiJson(response);
  }

  async listMyFollowing(): Promise<{ following: FollowUser[] }> {
    const response = await apiFetch(`${getApiBaseUrl()}/follows/me`, {
      headers: authHeaders(),
    });
    return parseApiJson(response);
  }

  async getFollowedLoops(page = 1, limit = 20) {
    const response = await apiFetch(
      `${getApiBaseUrl()}/follows/loops?page=${page}&limit=${limit}`,
      { headers: authHeaders() },
    );
    return parseApiJson<{
      loops: Array<Record<string, unknown>>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(response);
  }
}

export const followsApi = new FollowsApi();
