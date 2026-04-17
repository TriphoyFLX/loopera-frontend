import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { chatApi, type Chat, type Message } from '../utils/chatApi'
import './Chats.css'

const Chats = () => {
  const { user } = useAuth()
  const { chatId } = useParams<{ chatId?: string }>()
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Загрузка чатов
  useEffect(() => {
    const fetchChats = async () => {
      try {
        console.log('Fetching chats...');
        setIsLoadingChats(true)
        const response = await chatApi.getUserChats()
        console.log('Chats response:', response);
        setChats(response.chats)
        
        // Если есть chatId в URL, выбираем соответствующий чат
        if (chatId) {
          const chat = response.chats.find(c => c.id === parseInt(chatId))
          if (chat) {
            setSelectedChat(chat)
          }
        }
      } catch (err) {
        console.error('Error fetching chats:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки чатов')
      } finally {
        setIsLoadingChats(false)
      }
    }

    if (user) {
      fetchChats()
    }
  }, [chatId, user])

  // Загрузка сообщений при выборе чата
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          setIsLoadingMessages(true)
          const response = await chatApi.getChatMessages(selectedChat.id)
          setMessages(response.messages)
        } catch (err) {
          console.error('Error fetching messages:', err)
          setError(err instanceof Error ? err.message : 'Ошибка загрузки сообщений')
        } finally {
          setIsLoadingMessages(false)
        }
      }

      fetchMessages()
    }
  }, [selectedChat])

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat)
    setMessages([])
    setError(null)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    try {
      const response = await chatApi.sendMessage(selectedChat.id, newMessage.trim())
      setMessages([...messages, response.message])
      setNewMessage('')

      // Обновляем последний чат в списке
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                last_message: {
                  content: response.message.content,
                  created_at: response.message.created_at,
                  sender_id: response.message.sender_id
                },
                updated_at: response.message.created_at
              }
            : chat
        ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      )
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err instanceof Error ? err.message : 'Ошибка отправки сообщения')
    }
  }

  const getParticipantName = (chat: Chat) => {
    if (!user) return 'Unknown'
    return chat.participant1.id === user.id 
      ? chat.participant2.username 
      : chat.participant1.username
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Вчера'
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    }
  }

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id
  }

  if (isLoadingChats) {
    return (
      <div className="chats-page">
        <div className="chats-header">
          <h1>Сообщения</h1>
          <p>Загрузка чатов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="chats-page">
        <div className="chats-header">
          <h1>Сообщения</h1>
          <p style={{ color: '#ff6b6b' }}>Ошибка: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chats-page">
      <div className="chats-header">
        <h1>Сообщения</h1>
        <p>Общайтесь с другими музыкантами</p>
      </div>

      <div className="chats-container">
        {/* Список чатов */}
        <div className="chats-list">
          {chats.length === 0 ? (
            <div className="empty-chats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2>Нет чатов</h2>
              <p>Начните общение с другими пользователями</p>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="chat-avatar">
                  {getParticipantName(chat)[0].toUpperCase()}
                </div>
                <div className="chat-info">
                  <div className="chat-name">{getParticipantName(chat)}</div>
                  <div className="chat-last-message">
                    {chat.last_message?.content || 'Нет сообщений'}
                  </div>
                </div>
                <div className="chat-meta">
                  <div className="chat-time">
                    {chat.last_message?.created_at && formatTime(chat.last_message.created_at)}
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="chat-unread">{chat.unread_count}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Область чата */}
        {selectedChat ? (
          <div className="chat-area">
            <div className="chat-header">
              <div className="chat-header-avatar">
                {getParticipantName(selectedChat)[0].toUpperCase()}
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name">{getParticipantName(selectedChat)}</div>
                <div className="chat-header-status">
                  В сети
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {isLoadingMessages ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Загрузка сообщений...</p>
                </div>
              ) : (
                messages.map(message => (
                  <div key={message.id} className={`message ${isOwnMessage(message) ? 'own' : ''}`}>
                    <div className="message-avatar">
                      {isOwnMessage(message) ? 'Я' : getParticipantName(selectedChat)[0].toUpperCase()}
                    </div>
                    <div className="message-content">
                      <div className="message-bubble">{message.content}</div>
                      <div className="message-time">
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-container">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <textarea
                  className="chat-input"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  rows={1}
                />
                <button
                  type="submit"
                  className="chat-send-button"
                  disabled={!newMessage.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="chat-area">
            <div className="empty-chats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2>Выберите чат</h2>
              <p>Выберите чат из списка слева, чтобы начать общение</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Chats
