class API {
  private baseURL: string;

  constructor() {
    // Use HTTPS backend URL
    this.baseURL = 'https://loopera-lpr.vercel.app/api';
  }

  private async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      // Handle authentication errors
      if (response.status === 401) {
        const errorMessage = typeof data === 'string' 
          ? data 
          : data.message || 'Сессия истекла. Пожалуйста, войдите снова.';
        
        // Clear token from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        throw new Error(errorMessage);
      }
      
      const errorMessage = typeof data === 'string' 
        ? data 
        : data.message || `HTTP error! status: ${response.status}`;
      
      throw new Error(errorMessage);
    }
    
    return data;
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
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
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
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
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
      const response = await fetch(`${this.baseURL}/auth/resend-verification`, {
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
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
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
      const response = await fetch(`${this.baseURL}/auth/reset-password`, {
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
      const response = await fetch(`${this.baseURL}/loops/upload`, {
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
    try {
      const response = await fetch(`${this.baseURL}/loops/my?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user loops error:', error);
      throw error;
    }
  }

  async deleteLoop(id: number, token: string) {
    try {
      const response = await fetch(`${this.baseURL}/loops/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete loop error:', error);
      throw error;
    }
  }

  async getAllLoops(page: number = 1, limit: number = 6, token?: string, sortBy: string = 'created_at', tag?: string, genre?: string, minBpm?: number, maxBpm?: number, key?: string, search?: string) {
    try {
      let url = `${this.baseURL}/loops?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      if (tag) url += `&tag=${encodeURIComponent(tag)}`;
      if (genre) url += `&genre=${encodeURIComponent(genre)}`;
      if (minBpm) url += `&minBpm=${minBpm}`;
      if (maxBpm) url += `&maxBpm=${maxBpm}`;
      if (key) url += `&key=${encodeURIComponent(key)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get all loops error:', error);
      throw error;
    }
  }

  async getRandomLoops(limit: number = 10) {
    try {
      const response = await fetch(`${this.baseURL}/loops/random?limit=${limit}`, {
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
      const response = await fetch(`${this.baseURL}/loops/hashtags/popular?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get popular hashtags error:', error);
      throw error;
    }
  }

  async uploadBeat(formData: FormData, token: string) {
    try {
      const response = await fetch(`${this.baseURL}/beats/upload`, {
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

  async getAllBeats(page: number = 1, limit: number = 20, user_id?: number) {
    try {
      let url = `${this.baseURL}/beats?page=${page}&limit=${limit}`;
      if (user_id) url += `&user_id=${user_id}`;
      
      const response = await fetch(url, {
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
      const response = await fetch(`${this.baseURL}/beats/${id}`, {
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
      const response = await fetch(`${this.baseURL}/beats/loop/${loopId}/collaborations`, {
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
      const response = await fetch(`${this.baseURL}/beats/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete beat error:', error);
      throw error;
    }
  }
}

export const api = new API();
