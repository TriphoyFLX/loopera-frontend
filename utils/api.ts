class API {
  private baseURL: string;

  constructor() {
    const apiURL = import.meta.env.VITE_API_URL;
    this.baseURL = apiURL ? `${apiURL}/api` : '/api';
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
      console.log('API login called with:', { username, password: '***' });
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password })
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Login API error:', error);
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
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  }

  async verifyEmail(email: string, code: string, tempData: any) {
    try {
      console.log('API verifyEmail called with:', { email, code: '***' });
      
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, code, tempData })
      });
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('Verify email API error:', error);
      throw error;
    }
  }

  async uploadLoop(formData: FormData, token: string) {
    try {
      console.log('Uploading loop...');
      
      const response = await fetch(`${this.baseURL}/loops/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Upload loop error:', error);
      throw error;
    }
  }

  async getUserLoops(token: string) {
    try {
      const url = `${this.baseURL}/loops/my?token=${token}`;
      const response = await fetch(url, {
        headers: this.getHeaders(token)
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Get user loops error:', error);
      throw error;
    }
  }

  async getAllLoops(page: number = 1, limit: number = 20) {
    try {
      const response = await fetch(`${this.baseURL}/loops?page=${page}&limit=${limit}`);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Get all loops error:', error);
      throw error;
    }
  }

  async deleteLoop(id: number, token: string) {
    try {
      const response = await fetch(`${this.baseURL}/loops/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(token)
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Delete loop error:', error);
      throw error;
    }
  }
}

export const api = new API();