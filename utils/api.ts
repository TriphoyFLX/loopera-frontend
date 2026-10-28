import { getApiBaseUrl } from './urls';
import { apiFetch, parseApiJson } from './http';

class API {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiBaseUrl();
  }

  private async handleResponse<T = any>(response: Response): Promise<T> {
    return parseApiJson<T>(response);
  }

  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async login(username: string, password: string) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Если сервер возвращает requiresVerification (даже со статусом 403), возвращаем данные как есть
      if (data.requiresVerification) {
        return data;
      }

      // Если нет requiresVerification, но статус не OK - выбрасываем ошибку
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка входа');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: { username: string; email: string; password: string }) {
    try {
      console.log('API register called with:', { ...credentials, password: '***' });
      
      const response = await apiFetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(credentials)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async verifyEmail(email: string, code: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, code })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  async resendVerificationCode(email: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/auth/resend-verification`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Resend verification code error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, code, newPassword })
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async uploadLoop(formData: FormData, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Не устанавливаем Content-Type для FormData - браузер сделает это автоматически
        },
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Upload loop error:', error);
      throw error;
    }
  }

  async getUserLoops(token: string, page: number = 1, limit: number = 6) {
      const response = await apiFetch(`${this.baseURL}/loops/my?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
  }

  async getLoopsByUser(userIdOrUsername: string | number, page: number = 1, limit: number = 50, token?: string) {
      const response = await apiFetch(
        `${this.baseURL}/loops/user/${encodeURIComponent(String(userIdOrUsername))}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders(token),
        },
      );

      return await this.handleResponse(response);
  }

  async getUserCreatedPacks(token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/shop/my/created-packs`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user created packs error:', error);
      throw error;
    }
  }

  async getUserPurchasedPacks(token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/shop/my/packs`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user purchased packs error:', error);
      throw error;
    }
  }

  async getUserBalance(token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/shop/balance/my`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user balance error:', error);
      throw error;
    }
  }

  async getTransactionHistory(token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/shop/history`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  }

  async deleteLoop(id: number, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete loop error:', error);
      throw error;
    }
  }

  async getAllLoops(
    page: number = 1,
    limit: number = 6,
    token?: string,
    sortBy: string = 'created_at',
    tag?: string,
    genre?: string,
    minBpm?: number,
    maxBpm?: number,
    key?: string,
    search?: string,
    mood?: string,
  ) {
    try {
      let url = `${this.baseURL}/loops?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;
      if (genre) url += `&genre=${encodeURIComponent(genre)}`;
      if (minBpm) url += `&minBpm=${minBpm}`;
      if (maxBpm) url += `&maxBpm=${maxBpm}`;
      if (key) url += `&key=${encodeURIComponent(key)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (mood) url += `&mood=${encodeURIComponent(mood)}`;
      
      const response = await apiFetch(url, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get all loops error:', error);
      throw error;
    }
  }

  async getForYouLoops(page: number = 1, limit: number = 12, token?: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/for-you?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(token),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get for-you loops error:', error);
      throw error;
    }
  }

  async getRandomLoops(limit: number = 10) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/random?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get random loops error:', error);
      throw error;
    }
  }

  async getPopularHashtags(limit: number = 20) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/hashtags/popular?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get popular hashtags error:', error);
      throw error;
    }
  }

  async uploadAvatar(file: File, token: string) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiFetch(`${this.baseURL}/users/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return await this.handleResponse(response);
  }

  async getUserStats(token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/stats`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  async getUserStatsHistory(token: string, period: string = 'week') {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/stats/history?period=${period}`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user stats history error:', error);
      throw error;
    }
  }

  async trackLoopPlay(
    loopId: number,
    payload: { listened_seconds: number; duration_seconds?: number; completed?: boolean },
    token?: string,
  ) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/${loopId}/play`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!response.ok) return null;
      return await response.json().catch(() => null);
    } catch {
      return null;
    }
  }

  async trackTelegramClick(loopId: number, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/loops/telegram-click/${loopId}`, {
        method: 'POST',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Track telegram click error:', error);
      throw error;
    }
  }

  async uploadBeat(formData: FormData, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/beats/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Upload beat error:', error);
      throw error;
    }
  }

  async generateMelody(formData: FormData, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/melody/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Generate melody error:', error);
      throw error;
    }
  }

  async rewriteMelody(formData: FormData, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/melody/rewrite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Rewrite melody error:', error);
      throw error;
    }
  }

  async getAllBeats(page: number = 1, limit: number = 20, user_id?: number) {
    try {
      let url = `${this.baseURL}/beats?page=${page}&limit=${limit}`;
      if (user_id) url += `&user_id=${user_id}`;
      
      const response = await apiFetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get all beats error:', error);
      throw error;
    }
  }

  async getBeatById(id: number) {
    try {
      const response = await apiFetch(`${this.baseURL}/beats/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get beat by id error:', error);
      throw error;
    }
  }

  async getLoopCollaborations(loopId: number) {
    try {
      const response = await apiFetch(`${this.baseURL}/beats/loop/${loopId}/collaborations`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get loop collaborations error:', error);
      throw error;
    }
  }

  async deleteBeat(id: number, token: string) {
    try {
      const response = await apiFetch(`${this.baseURL}/beats/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete beat error:', error);
      throw error;
    }
  }

  async getLoopTokFeed(
    page: number = 1,
    limit: number = 10,
    token?: string,
    mode: 'fyp' | 'latest' = 'fyp',
  ) {
    const response = await apiFetch(
      `${this.baseURL}/looptok/feed?page=${page}&limit=${limit}&mode=${mode}`,
      {
        method: 'GET',
        headers: this.getHeaders(token),
      },
    );
    return await this.handleResponse(response);
  }

  async uploadLoopTok(formData: FormData, token: string) {
    const response = await apiFetch(`${this.baseURL}/looptok/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return await this.handleResponse(response);
  }

  async toggleLoopTokLike(postId: number, token: string) {
    const response = await apiFetch(`${this.baseURL}/looptok/${postId}/like`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    return await this.handleResponse(response);
  }

  async trackLoopTokView(postId: number) {
    const response = await apiFetch(`${this.baseURL}/looptok/${postId}/view`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async trackLoopTokShare(postId: number) {
    const response = await apiFetch(`${this.baseURL}/looptok/${postId}/share`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async getLoopById(loopId: number) {
    const response = await apiFetch(`${this.baseURL}/loops/${loopId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async getLoopComments(loopId: number, page: number = 1, limit: number = 40) {
    const response = await apiFetch(
      `${this.baseURL}/loops/${loopId}/comments?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );
    return await this.handleResponse(response);
  }

  async addLoopComment(loopId: number, body: string, token: string) {
    const response = await apiFetch(`${this.baseURL}/loops/${loopId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ body }),
    });
    return await this.handleResponse(response);
  }

  async toggleLoopCommentLike(commentId: number, token: string) {
    const response = await apiFetch(`${this.baseURL}/loops/comments/${commentId}/like`, {
      method: 'POST',
      headers: this.getHeaders(token),
    });
    return await this.handleResponse<{ liked: boolean; likes_count: number }>(response);
  }

  async getLoopTokComments(postId: number, page: number = 1, limit: number = 40) {
    const response = await apiFetch(
      `${this.baseURL}/looptok/${postId}/comments?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    );
    return await this.handleResponse(response);
  }

  async addLoopTokComment(postId: number, body: string, token: string) {
    const response = await apiFetch(`${this.baseURL}/looptok/${postId}/comments`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ body }),
    });
    return await this.handleResponse(response);
  }

  async deleteLoopTokPost(postId: number, token: string) {
    const response = await apiFetch(`${this.baseURL}/looptok/${postId}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });
    return await this.handleResponse(response);
  }

  async getBillingPlans() {
    const response = await apiFetch(`${this.baseURL}/billing/plans`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async getMyBilling(token: string) {
    const response = await apiFetch(`${this.baseURL}/billing/me`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });
    return await this.handleResponse(response);
  }

  async checkoutPlan(
    plan: 'basic' | 'pro' | 'business' | 'elite',
    period: 'monthly' | 'yearly',
    token: string,
  ) {
    const response = await apiFetch(`${this.baseURL}/billing/checkout`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ plan, period }),
    });
    return await this.handleResponse(response);
  }

  async confirmSubscription(paymentId: string, token: string) {
    const response = await apiFetch(`${this.baseURL}/billing/confirm`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ payment_id: paymentId }),
    });
    return await this.handleResponse(response);
  }

  async updateProfileTheme(theme: Record<string, unknown>, token: string) {
    const response = await apiFetch(`${this.baseURL}/billing/theme`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(theme),
    });
    return await this.handleResponse(response);
  }

  async getAuthorPlan(userId: number) {
    const response = await apiFetch(`${this.baseURL}/billing/author/${userId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async downloadLoop(loopId: number, token: string, filenameHint?: string) {
    const response = await apiFetch(`${this.baseURL}/loops/${loopId}/download`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const err = new Error(data.message || 'Download failed') as Error & {
        code?: string;
        action?: string;
        plan?: string;
      };
      err.code = data.code;
      err.action = data.action;
      err.plan = data.plan;
      throw err;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameHint || `loopera_${loopId}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getLoopAdsMeta() {
    const response = await apiFetch(`${this.baseURL}/loop-ads/meta`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return await this.handleResponse<{
      cost_per_impression: number;
      min_budget: number;
      currency: string;
    }>(response);
  }

  async getMyLoopAds() {
    const response = await apiFetch(`${this.baseURL}/loop-ads/mine`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return await this.handleResponse<{ ads: any[] }>(response);
  }

  async createLoopAd(loopId: number, budget: number) {
    const response = await apiFetch(`${this.baseURL}/loop-ads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ loop_id: loopId, budget }),
    });
    return await this.handleResponse(response);
  }

  async pauseLoopAd(adId: number) {
    const response = await apiFetch(`${this.baseURL}/loop-ads/${adId}/pause`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }

  async resumeLoopAd(adId: number) {
    const response = await apiFetch(`${this.baseURL}/loop-ads/${adId}/resume`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return await this.handleResponse(response);
  }
}

export const api = new API();
