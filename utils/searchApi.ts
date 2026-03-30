import { tokenStorage } from './tokenStorage';

export interface LoopArtist {
  id: number;
  username: string;
  hashtag: string;
  loops_count: number;
}

class SearchApi {
  private baseURL: string;

  constructor() {
    const apiURL = import.meta.env.VITE_API_URL;
    this.baseURL = apiURL ? `${apiURL}/api` : '/api';
  }

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
