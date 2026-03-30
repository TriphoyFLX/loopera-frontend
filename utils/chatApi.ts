import { tokenStorage } from './tokenStorage';

const baseURL = `${import.meta.env.VITE_API_URL}/api`;

interface Chat {
  id: number;
  participant1_id: number;
  participant2_id: number;
  created_at: string;
  updated_at: string;
  participant1: {
    id: number;
    username: string;
  };
  participant2: {
    id: number;
    username: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count: number;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
}

interface User {
  id: number;
  username: string;
  created_at: string;
}

class ChatApi {
  constructor() {
    // Токен теперь берется через tokenStorage в каждом запросе
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${baseURL}${endpoint}`;
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

  // Получение всех чатов пользователя
  async getUserChats(): Promise<{ chats: Chat[] }> {
    return this.request('/chats');
  }

  // Получение сообщений конкретного чата
  async getChatMessages(chatId: number): Promise<{ messages: Message[] }> {
    return this.request(`/chats/${chatId}/messages`);
  }

  // Создание или получение существующего чата
  async createOrGetChat(participantId: number): Promise<{ chat: Chat }> {
    return this.request('/chats/create', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    });
  }

  // Отправка сообщения
  async sendMessage(chatId: number, content: string): Promise<{ message: Message }> {
    return this.request('/chats/send', {
      method: 'POST',
      body: JSON.stringify({ chatId, content }),
    });
  }

  // Получение информации о пользователе
  async getUserInfo(userId: number): Promise<{ user: User }> {
    return this.request(`/chats/user/${userId}`);
  }
}

export const chatApi = new ChatApi();
export type { Chat, Message, User };
