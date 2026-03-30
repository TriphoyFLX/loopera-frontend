import { tokenStorage } from './tokenStorage';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export interface TopUser {
  id: number;
  username: string;
  email: string;
  hashtag: string;
  avatar_url?: string;
  created_at: string;
  loops_count: number;
  total_likes: number;
  avg_rating?: number;
}

export interface TopUsersResponse {
  users: TopUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class TopUsersApi {
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = tokenStorage.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response;
  }

  // Получить топ пользователей по количеству лупов и лайков
  async getTopUsers(limit: number = 6): Promise<TopUsersResponse> {
    const response = await this.request(`/users/top?limit=${limit}`);
    return response.json();
  }

  // Получить статистику пользователя
  async getUserStats(userId: number): Promise<{
    loops_count: number;
    total_likes: number;
    avg_rating: number;
  }> {
    const response = await this.request(`/users/${userId}/stats`);
    return response.json();
  }
}

export const topUsersApi = new TopUsersApi();
