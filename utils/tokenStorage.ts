// Утилита для работы с токеном
// Используем localStorage для хранения токена и данных пользователя

export const tokenStorage = {
  getToken: (): string | null => {
    try {
      const token = localStorage.getItem('token');
      console.log('tokenStorage.getToken():', token ? 'token exists' : 'no token');
      return token;
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
      return null;
    }
  },

  setToken: (token: string): void => {
    try {
      console.log('tokenStorage.setToken(): saving token');
      localStorage.setItem('token', token);
      console.log('tokenStorage.setToken(): token saved successfully');
    } catch (error) {
      console.error('Error setting token to localStorage:', error);
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  },

  getUser: (): any => {
    try {
      const user = localStorage.getItem('user');
      if (!user || user === 'undefined') {
        return null;
      }
      return JSON.parse(user);
    } catch (error) {
      console.error('Error getting user from localStorage:', error);
      return null;
    }
  },

  setUser: (user: any): void => {
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user to localStorage:', error);
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from localStorage:', error);
    }
  }
};
