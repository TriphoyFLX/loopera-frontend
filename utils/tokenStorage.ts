// Утилита для работы с токеном
// Используем localStorage для хранения токена и данных пользователя

export const tokenStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
      return null;
    }
  },

  setToken: (token: string): void => {
    try {
      localStorage.setItem('token', token);
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
      return user ? JSON.parse(user) : null;
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
