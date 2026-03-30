// Утилита для работы с токеном через переменные окружения
// В production используем переменные окружения, в development - localStorage

const isDevelopment = import.meta.env.DEV;

export const tokenStorage = {
  getToken: (): string | null => {
    if (isDevelopment) {
      return localStorage.getItem('token');
    }
    // В production токен будет передаваться через HTTP-only cookies или заголовки
    return null; // Будет заменено на получение из cookies/headers
  },

  setToken: (token: string): void => {
    if (isDevelopment) {
      localStorage.setItem('token', token);
    }
    // В production токен устанавливается через HTTP-only cookies
  },

  removeToken: (): void => {
    if (isDevelopment) {
      localStorage.removeItem('token');
    }
    // В production токен удаляется через HTTP-only cookies
  },

  getUser: (): any => {
    if (isDevelopment) {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    // В production данные пользователя получаются из API
    return null;
  },

  setUser: (user: any): void => {
    if (isDevelopment) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    // В production данные пользователя не хранятся на клиенте
  },

  removeUser: (): void => {
    if (isDevelopment) {
      localStorage.removeItem('user');
    }
    // В production данные пользователя не хранятся на клиенте
  }
};
