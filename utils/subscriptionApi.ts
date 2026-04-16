import { tokenStorage } from './tokenStorage';

const getBaseURL = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  return apiURL ? `${apiURL}/api` : '/api';
};

interface Subscription {
  id: number;
  artist_hashtag: string;
  created_at: string;
}

interface Loop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  created_at: string;
  author?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class SubscriptionApi {
  constructor() {
    // Токен теперь берется через tokenStorage в каждом запросе
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const currentToken = tokenStorage.getToken();
    console.log('SubscriptionApi.request(): token =', currentToken ? 'exists' : 'missing');
    const url = `${getBaseURL()}${endpoint}`;
    console.log('SubscriptionApi.request(): url =', url);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Всегда берем актуальный токен через tokenStorage
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('SubscriptionApi.request() error:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Получение подписок пользователя
  async getUserSubscriptions(): Promise<{ subscriptions: Subscription[] }> {
    return this.request('/subscriptions');
  }

  // Добавление подписки на артиста
  async addSubscription(artistHashtag: string): Promise<{ subscription: Subscription }> {
    return this.request('/subscriptions/add', {
      method: 'POST',
      body: JSON.stringify({ artist_hashtag: artistHashtag }),
    });
  }

  // Удаление подписки
  async removeSubscription(subscriptionId: number): Promise<{ message: string }> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Получение лупов от подписанных артистов
  async getSubscribedLoops(page: number = 1, limit: number = 20): Promise<{ 
    loops: Loop[];
    pagination: PaginationInfo;
  }> {
    return this.request(`/subscriptions/loops?page=${page}&limit=${limit}`);
  }
}

export const subscriptionApi = new SubscriptionApi();
export type { Subscription, Loop, PaginationInfo };
