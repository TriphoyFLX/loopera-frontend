import { tokenStorage } from './tokenStorage';

const getBaseURL = () => {
  // Жестко задаем URL бэкенда для обхода проблем с env
  return 'https://loopera-lpr.vercel.app/api';
};

export interface LoopArtist {
  id: number;
  username: string;
  hashtag: string;
  loops_count: number;
}

class SearchApi {
  constructor() {
    this.baseURL = getBaseURL();
  }
  private baseURL: string;

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Всегда берем актуальный токен через tokenStorage
    const currentToken = tokenStorage.getToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Поиск артистов по имени или хештегу
  async searchArtists(query: string): Promise<{ artists: LoopArtist[] }> {
    if (!query || query.length < 2) {
      return { artists: [] };
    }

    return this.request(`/search/artists?q=${encodeURIComponent(query)}`);
  }

  // Поиск лупов
  async searchLoops(query: string): Promise<{ loops: any[] }> {
    if (!query || query.length < 2) {
      return { loops: [] };
    }

    return this.request(`/search/loops?q=${encodeURIComponent(query)}`);
  }
}

export const searchApi = new SearchApi();
