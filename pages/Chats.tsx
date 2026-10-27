import { useState, useEffect, useRef, useMemo, Fragment, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n/useI18n'
import { chatApi, type Chat, type Message } from '../utils/chatApi'
import { LOOP_COVER_COLORS } from '../utils/loopCover'
import styles from './Chats.module.css'

const GROUP_WINDOW_MS = 5 * 60 * 1000
const POLL_MS = 3000
const SUPPORT_NAMES = new Set(['loopera_admin', 'support'])

const Chats = () => {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { chatId } = useParams<{ chatId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [query, setQuery] = useState('')
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedChatIdRef = useRef<number | null>(null)
  const supportOpenedRef = useRef(false)

  const isSupportPeer = useCallback((name: string) => SUPPORT_NAMES.has(name.toLowerCase()), [])

  const getPeer = useCallback((chat: Chat) => {
    if (!user) return { username: '—', isSupport: false }
    const raw =
      chat.participant1.id === user.id
        ? chat.participant2.username
        : chat.participant1.username
    const isSupport = isSupportPeer(raw)
    return { username: raw, isSupport, display: isSupport ? 'Техподдержка' : raw }
  }, [user, isSupportPeer])

  const getParticipantName = useCallback((chat: Chat) => {
    const peer = getPeer(chat)
    return peer.display || peer.username
  }, [getPeer])

  const refreshChats = useCallback(async (silent = false) => {
    if (!user) return [] as Chat[]
    try {
      if (!silent) setIsLoadingChats(true)
      const response = await chatApi.getUserChats()
      setChats(response.chats)
      return response.chats
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Error')
      return [] as Chat[]
    } finally {
      if (!silent) setIsLoadingChats(false)
    }
  }, [user])

  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id ?? null
  }, [selectedChat?.id])

  useEffect(() => {
    if (!user) return

    const wantSupport = searchParams.get('support') === '1'
    const boot = async () => {
      const list = await refreshChats()

      if (wantSupport && !supportOpenedRef.current) {
        supportOpenedRef.current = true
        try {
          const { chat } = await chatApi.openSupportChat()
          setChats((prev) => (prev.some((c) => c.id === chat.id) ? prev : [chat, ...prev]))
          setSelectedChat(chat)
          setSearchParams({}, { replace: true })
          navigate(`/chats/${chat.id}`, { replace: true })
          return
        } catch (err) {
          supportOpenedRef.current = false
          setError(err instanceof Error ? err.message : 'Не удалось открыть поддержку')
        }
      }

      if (chatId) {
        const chat = list.find((c) => c.id === parseInt(chatId, 10))
        if (chat) setSelectedChat(chat)
      }
    }

    void boot()
  }, [chatId, user, refreshChats, searchParams, setSearchParams, navigate])

  useEffect(() => {
    if (!selectedChat) return

    let cancelled = false
    const loadMessages = async (silent = false) => {
      try {
        if (!silent) setIsLoadingMessages(true)
        const response = await chatApi.getChatMessages(selectedChat.id)
        if (!cancelled && selectedChatIdRef.current === selectedChat.id) {
          setMessages(response.messages)
        }
      } catch (err) {
        if (!silent && !cancelled) {
          setError(err instanceof Error ? err.message : 'Error')
        }
      } finally {
        if (!silent && !cancelled) setIsLoadingMessages(false)
      }
    }

    void loadMessages(false)
    const poll = window.setInterval(() => {
      void loadMessages(true)
      void refreshChats(true)
    }, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(poll)
    }
  }, [selectedChat, refreshChats])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat)
    setMessages([])
    setError(null)
    navigate(`/chats/${chat.id}`, { replace: true })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    try {
      const response = await chatApi.sendMessage(selectedChat.id, newMessage.trim())
      setMessages(prev => [...prev, response.message])
      setNewMessage('')

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
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US'

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })

  const formatListTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const diffInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) return formatTime(timestamp)
    if (diffInHours < 48) return t('chatsPage.yesterday')
    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
  }

  const formatDay = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
    if (sameDay(date, today)) return t('chatsPage.today')
    if (sameDay(date, yesterday)) return t('chatsPage.yesterday')

    return date.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' })
  }

  const isOwnMessage = (message: Message) => message.sender_id === user?.id

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((chat) => getParticipantName(chat).toLowerCase().includes(q))
  }, [chats, query, getParticipantName])

  const initial = (name: string) => (name[0] || '?').toUpperCase()

  const avatarStyle = (name: string) => ({
    backgroundColor:
      LOOP_COVER_COLORS[
        Math.abs(
          Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
        ) % LOOP_COVER_COLORS.length
      ],
  })

  const renderMessages = () => {
    if (isLoadingMessages) {
      return <div className={styles.stateText}>{t('chatsPage.loadingMessages')}</div>
    }

    if (messages.length === 0) {
      return (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('chatsPage.noMessages')}</p>
        </div>
      )
    }

    return messages.map((message, index) => {
      const prev = messages[index - 1]
      const own = isOwnMessage(message)
      const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(message.created_at).toDateString()
      const grouped =
        !newDay &&
        prev &&
        prev.sender_id === message.sender_id &&
        new Date(message.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS
      const next = messages[index + 1]
      const isLastOfGroup =
        !next ||
        next.sender_id !== message.sender_id ||
        new Date(next.created_at).getTime() - new Date(message.created_at).getTime() >= GROUP_WINDOW_MS

      return (
        <Fragment key={message.id}>
          {newDay && <div className={styles.daySeparator}>{formatDay(message.created_at)}</div>}
          <div
            className={`${styles.row} ${own ? styles.rowOwn : ''} ${grouped ? styles.rowGrouped : styles.rowFirst}`}
          >
            <div className={`${styles.bubble} ${own ? styles.bubbleOwn : ''}`}>{message.content}</div>
            {isLastOfGroup && <div className={styles.time}>{formatTime(message.created_at)}</div>}
          </div>
        </Fragment>
      )
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{t('chatsPage.title')}</h1>
      </header>

      <div className={`${styles.layout} ${selectedChat ? styles.chatOpen : ''}`}>
        <aside className={`${styles.panel} ${styles.sidebar}`}>
          <div className={styles.sidebarHead}>
            <input
              className={styles.search}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('chatsPage.search')}
            />
          </div>

          {isLoadingChats ? (
            <div className={styles.stateText}>{t('chatsPage.loadingChats')}</div>
          ) : error && chats.length === 0 ? (
            <div className={`${styles.stateText} ${styles.error}`}>{error}</div>
          ) : filteredChats.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>
                {chats.length === 0 ? t('chatsPage.noChats') : t('chatsPage.noMatches')}
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {filteredChats.map(chat => {
                const peer = getPeer(chat)
                const name = peer.display || peer.username
                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={`${styles.item} ${selectedChat?.id === chat.id ? styles.itemActive : ''}`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <span className={styles.avatar} style={avatarStyle(name)}>
                      {initial(name)}
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemName}>{name}</span>
                      <span className={styles.itemPreview}>
                        {chat.last_message?.content || t('chatsPage.noMessages')}
                      </span>
                    </span>
                    <span className={styles.itemMeta}>
                      {chat.last_message?.created_at && (
                        <span className={styles.itemTime}>{formatListTime(chat.last_message.created_at)}</span>
                      )}
                      {chat.unread_count > 0 && <span className={styles.badge}>{chat.unread_count}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className={`${styles.panel} ${styles.chat}`}>
          {selectedChat ? (
            <>
              <div className={styles.chatHead}>
                <button
                  type="button"
                  className={styles.back}
                  onClick={() => setSelectedChat(null)}
                  aria-label={t('chatsPage.back')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                {(() => {
                  const peer = getPeer(selectedChat)
                  const name = peer.display || peer.username
                  const goProfile = () => {
                    if (peer.isSupport) return
                    navigate(`/${encodeURIComponent(peer.username)}`)
                  }
                  return (
                    <>
                      <button
                        type="button"
                        className={styles.avatarBtn}
                        style={avatarStyle(name)}
                        onClick={goProfile}
                        disabled={peer.isSupport}
                        aria-label={name}
                      >
                        {initial(name)}
                      </button>
                      <div className={styles.chatHeadBody}>
                        <button
                          type="button"
                          className={styles.chatHeadName}
                          onClick={goProfile}
                          disabled={peer.isSupport}
                        >
                          {name}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className={styles.messages}>
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className={styles.composer}>
                <textarea
                  className={styles.input}
                  placeholder={t('chatsPage.placeholder')}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                  rows={1}
                />
                <button type="submit" className={styles.send} disabled={!newMessage.trim()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className={styles.empty}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className={styles.emptyTitle}>{t('chatsPage.pickChat')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Chats
