import { tokenStorage } from './tokenStorage';
import { getApiBaseUrl } from './urls';
import { apiFetch, parseApiJson } from './http';

const getBaseURL = () => {
  return getApiBaseUrl();
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const currentToken = tokenStorage.getToken();
    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    const response = await apiFetch(url, {
      ...options,
      headers,
    });

    return parseApiJson<T>(response);
  }

  // Поиск артистов по имени или хештегу
  async searchArtists(query: string): Promise<{ artists: LoopArtist[] }> {
    const q = query.trim();
    if (!q) {
      return { artists: [] };
    }

    return this.request(`/search/artists?q=${encodeURIComponent(q)}`);
  }

  // Поиск лупов
  async searchLoops(query: string): Promise<{ loops: any[] }> {
    const q = query.trim();
    if (!q) {
      return { loops: [] };
    }

    return this.request(`/search/loops?q=${encodeURIComponent(q)}`);
  }
}

export const searchApi = new SearchApi();
