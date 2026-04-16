import { tokenStorage } from './tokenStorage';

const getBaseURL = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  return apiURL ? `${apiURL}/api` : '/api';
};

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
    const baseURL = getBaseURL();
    const url = `${baseURL}${endpoint}`;
    
    console.log('LikeApi.request():');
    console.log('  baseURL =', baseURL);
    console.log('  endpoint =', endpoint);
    console.log('  token =', token ? 'exists' : 'missing');
    console.log('  full url =', url);
    console.log('  Authorization header =', token ? `Bearer ${token.substring(0, 20)}...` : 'missing');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('LikeApi.request() error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response;
  }

  // Лайкнуть/дизлайкнуть луп
  async toggleLike(loopId: number): Promise<LikeResponse> {
    const response = await this.request(`/loops/${loopId}/like`, {
      method: 'POST',
    });
    
    return response.json();
  }

  // Получить статус лайка для лупа
  async getLikeStatus(loopId: number): Promise<{ liked: boolean; likes_count: number }> {
    const response = await this.request(`/loops/${loopId}/like-status`);
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
    const response = await this.request(`/loops/liked?page=${page}&limit=${limit}`);
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
