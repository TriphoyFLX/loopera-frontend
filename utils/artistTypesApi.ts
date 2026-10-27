import { getApiBaseUrl } from './urls';
import { tokenStorage } from './tokenStorage';

export interface ArtistType {
  id: number;
  name: string;
  slug: string;
  aliases?: string[];
  sort_order?: number;
  is_active?: boolean;
}

const getAuthHeaders = () => {
  const token = tokenStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface OnboardingStatus {
  onboarding_completed: boolean;
  should_prompt: boolean;
  subscription_count: number;
  min_required: number;
  skipped_at?: string | null;
  remind_after_hours?: number;
}

export const MIN_ARTIST_PREFERENCES = 3;

export const artistTypesApi = {
  async getPublicArtists(): Promise<ArtistType[]> {
    const response = await fetch(`${getApiBaseUrl()}/artist-types`);
    if (!response.ok) throw new Error('Не удалось загрузить артистов');
    const data = await response.json();
    return data.artists;
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await fetch(`${getApiBaseUrl()}/onboarding/status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Не удалось получить статус онбординга');
    return response.json();
  },

  async updateArtistPreferences(artists: string[]) {
    const response = await fetch(`${getApiBaseUrl()}/onboarding/artists`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artists }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Не удалось обновить тайпы');
    }
    return response.json();
  },

  async completeOnboarding(artists: string[]) {
    const response = await fetch(`${getApiBaseUrl()}/onboarding/artists`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ artists }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Не удалось сохранить артистов');
    }
    return response.json();
  },

  async skipOnboarding() {
    const response = await fetch(`${getApiBaseUrl()}/onboarding/skip`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Не удалось пропустить онбординг');
    return response.json();
  },

  async getAdminArtists(token: string): Promise<ArtistType[]> {
    const response = await fetch(`${getApiBaseUrl()}/admin/artist-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Не удалось загрузить артистов');
    const data = await response.json();
    return data.artists;
  },

  async createArtist(token: string, payload: Partial<ArtistType>) {
    const response = await fetch(`${getApiBaseUrl()}/admin/artist-types`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Не удалось создать артиста');
    }
    return response.json();
  },

  async updateArtist(token: string, id: number, payload: Partial<ArtistType>) {
    const response = await fetch(`${getApiBaseUrl()}/admin/artist-types/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Не удалось обновить артиста');
    }
    return response.json();
  },

  async deleteArtist(token: string, id: number) {
    const response = await fetch(`${getApiBaseUrl()}/admin/artist-types/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Не удалось удалить артиста');
    return response.json();
  },
};
