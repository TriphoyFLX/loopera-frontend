import { tokenStorage } from './tokenStorage';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export interface LikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}

export interface LikedLoop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  bpm: number;
  key: string;
  genre: string;
  tags: string[];
  user_id: number;
  author: string;
  created_at: string;
  liked_at: string;
}

class LikeApi {
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

  // Лайкнуть/дизлайкнуть луп
  async toggleLike(loopId: number): Promise<LikeResponse> {
    const response = await this.request(`/loops/loops/${loopId}/like`, {
      method: 'POST',
    });
    
    return response.json();
  }

  // Получить статус лайка для лупа
  async getLikeStatus(loopId: number): Promise<{ liked: boolean; likes_count: number }> {
    const response = await this.request(`/loops/loops/${loopId}/like-status`);
    return response.json();
  }

  // Получить избранные лупы пользователя
  async getLikedLoops(page: number = 1, limit: number = 20): Promise<{
    loops: LikedLoop[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await this.request(`/loops/loops/liked?page=${page}&limit=${limit}`);
    return response.json();
  }

  // Проверить лайкнут ли луп
  async isLoopLiked(loopId: number): Promise<boolean> {
    try {
      const status = await this.getLikeStatus(loopId);
      return status.liked;
    } catch (error) {
      return false;
    }
  }

  // Получить количество лайков для лупа
  async getLikesCount(loopId: number): Promise<number> {
    try {
      const status = await this.getLikeStatus(loopId);
      return status.likes_count;
    } catch (error) {
      return 0;
    }
  }
}

export const likeApi = new LikeApi();
