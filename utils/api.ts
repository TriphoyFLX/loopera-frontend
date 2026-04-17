class API {
  private baseURL: string;

  constructor() {
    // Жестко задаем URL бэкенда для обхода проблем с env
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
        headers: this.getHeaders(token),
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
      const response = await fetch(`${this.baseURL}/loops?page=${page}&limit=${limit}`, {
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

  async getAllLoops(page: number = 1, limit: number = 6, token?: string) {
    try {
      const url = token 
        ? `${this.baseURL}/loops?page=${page}&limit=${limit}`
        : `${this.baseURL}/loops/public?page=${page}&limit=${limit}`;
      
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
}

export const api = new API();
