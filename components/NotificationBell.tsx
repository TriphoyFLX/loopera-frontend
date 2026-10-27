import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { notificationsApi, type AppNotification } from '../utils/notificationsApi';
import styles from './NotificationBell.module.css';

const NotificationBell = () => {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const [list, count] = await Promise.all([
        notificationsApi.list(30),
        isAuthenticated ? notificationsApi.unreadCount() : Promise.resolve(0),
      ]);
      setItems(list.notifications || []);
      setUnread(count);
    } catch (err) {
      console.error('Notifications load failed:', err);
    }
  };

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(id);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const onOpenItem = async (item: AppNotification) => {
    if (isAuthenticated && !item.is_read) {
      try {
        await notificationsApi.markRead(item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const onMarkAll = async () => {
    if (!isAuthenticated || unread === 0) return;
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => void toggle()}
        aria-label={t('notifications.aria')}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('notifications.title')}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelTitle}>{t('notifications.title')}</p>
              <p className={styles.panelSub}>
                {unread > 0 ? t('notifications.unread', { count: unread }) : t('notifications.allRead')}
              </p>
            </div>
            {isAuthenticated && unread > 0 && (
              <button type="button" className={styles.markAll} onClick={() => void onMarkAll()}>
                {t('notifications.markAll')}
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && items.length === 0 && <p className={styles.empty}>{t('loading.default')}</p>}
            {!loading && items.length === 0 && <p className={styles.empty}>{t('notifications.empty')}</p>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.item} ${!item.is_read ? styles.itemUnread : ''}`}
                onClick={() => void onOpenItem(item)}
              >
                <div className={styles.itemTop}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  {!item.is_read && <span className={styles.dot} />}
                </div>
                <p className={styles.itemBody}>{item.body}</p>
                <span className={styles.itemMeta}>
                  {new Date(item.created_at).toLocaleString(dateLocale, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {item.author_name ? ` · ${item.author_name}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
