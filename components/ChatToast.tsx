import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatApi, type Chat } from '../utils/chatApi';
import styles from './ChatToast.module.css';

type Toast = {
  id: string;
  chatId: number;
  name: string;
  preview: string;
};

/**
 * Corner toast when someone writes in chats while you're elsewhere.
 * Polls chat list for rising unread counts.
 */
const ChatToast = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState<Toast | null>(null);
  const prevUnread = useRef<Map<number, number>>(new Map());
  const primed = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const tick = async () => {
      try {
        const { chats } = await chatApi.getUserChats();
        const next = new Map<number, number>();
        let newest: Toast | null = null;

        for (const chat of chats as Chat[]) {
          const unread = chat.unread_count || 0;
          next.set(chat.id, unread);
          const prev = prevUnread.current.get(chat.id) ?? 0;
          if (primed.current && unread > prev) {
            const peer =
              chat.participant1.id === user.id
                ? chat.participant2.username
                : chat.participant1.username;
            newest = {
              id: `${chat.id}-${Date.now()}`,
              chatId: chat.id,
              name: peer,
              preview: chat.last_message?.content?.slice(0, 80) || 'Новое сообщение',
            };
          }
        }

        prevUnread.current = next;
        primed.current = true;

        if (newest && !location.pathname.startsWith('/chats')) {
          setToast(newest);
        }
      } catch {
        /* ignore */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 8000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, user, location.pathname]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;

  return (
    <button
      type="button"
      className={styles.toast}
      onClick={() => {
        setToast(null);
        navigate(`/chats/${toast.chatId}`);
      }}
    >
      <span className={styles.label}>Сообщение</span>
      <strong className={styles.name}>{toast.name}</strong>
      <span className={styles.preview}>{toast.preview}</span>
    </button>
  );
};

export default ChatToast;
