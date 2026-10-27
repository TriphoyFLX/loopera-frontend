import { tokenStorage } from './tokenStorage';
import { getApiBaseUrl } from './urls';
import { apiFetch, parseApiJson } from './http';

export type HomePostKind = 'news' | 'ad';

export type HomePost = {
  id: number;
  kind: HomePostKind;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_url?: string | null;
  image_url?: string | null;
  created_at: string;
  is_active?: boolean;
  sort_order?: number;
  updated_at?: string;
  author_name?: string | null;
};

export type HomePostInput = {
  kind: HomePostKind;
  title: string;
  body: string;
  cta_label?: string;
  cta_url?: string;
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenStorage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

class HomePostsApi {
  async listPublic(): Promise<{ posts: HomePost[] }> {
    const response = await apiFetch(`${getApiBaseUrl()}/home/posts`);
    return parseApiJson(response);
  }

  async adminList(): Promise<{ posts: HomePost[] }> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/home-posts`, {
      headers: authHeaders(),
    });
    return parseApiJson(response);
  }

  async create(input: HomePostInput): Promise<{ post: HomePost }> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/home-posts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return parseApiJson(response);
  }

  async update(id: number, input: Partial<HomePostInput>): Promise<{ post: HomePost }> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/home-posts/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(input),
    });
    return parseApiJson(response);
  }

  async remove(id: number): Promise<void> {
    const response = await apiFetch(`${getApiBaseUrl()}/admin/home-posts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await parseApiJson(response);
  }
}

export const homePostsApi = new HomePostsApi();
