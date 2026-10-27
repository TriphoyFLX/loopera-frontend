import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { loopDetailPath } from '../utils/routes';
import { getLoopCoverColor, getLoopCoverUrl } from '../utils/loopCover';
import styles from './Statistics.module.css';

type Period = 'day' | 'week' | 'month';

type TopLoop = {
  id: number;
  title: string;
  cover_url?: string | null;
  bpm?: number;
  key?: string;
  plays?: number;
  likes?: number;
  avg_listen_seconds?: number;
  total_listen_seconds?: number;
};

type StatsPayload = {
  total_loops: number;
  total_likes: number;
  total_telegram_clicks: number;
  total_file_size: number;
  avg_likes_per_loop: number;
  total_plays: number;
  completed_plays: number;
  avg_listen_seconds: number;
  total_listen_seconds: number;
  unique_listeners: number;
  total_downloads: number;
  total_comments: number;
  top_loops_by_plays: TopLoop[];
  top_loops_by_likes: TopLoop[];
  top_loops_by_listen: TopLoop[];
  recent_days: Array<{ day: string; plays: number; listen_seconds: number }>;
};

type HistoryPayload = {
  likes_over_time: Array<{ date: string; count: number }>;
  loops_over_time: Array<{ date: string; count: number }>;
  plays_over_time: Array<{ date: string; count: number; listen_seconds?: number }>;
  downloads_over_time: Array<{ date: string; count: number }>;
};

const emptyStats: StatsPayload = {
  total_loops: 0,
  total_likes: 0,
  total_telegram_clicks: 0,
  total_file_size: 0,
  avg_likes_per_loop: 0,
  total_plays: 0,
  completed_plays: 0,
  avg_listen_seconds: 0,
  total_listen_seconds: 0,
  unique_listeners: 0,
  total_downloads: 0,
  total_comments: 0,
  top_loops_by_plays: [],
  top_loops_by_likes: [],
  top_loops_by_listen: [],
  recent_days: [],
};

const formatSeconds = (sec: number) => {
  const s = Math.max(0, Math.round(sec || 0));
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}м ${r}с` : `${m}м`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}ч ${rm}м` : `${h}ч`;
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / k ** i).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const formatAxisDate = (value: string, period: Period) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  if (period === 'day') {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const tooltipStyle = {
  backgroundColor: '#1a1a1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
};

const LoopMini = ({
  loop,
  metric,
  metricLabel,
}: {
  loop: TopLoop;
  metric: string | number;
  metricLabel: string;
}) => {
  const url = getLoopCoverUrl(loop);
  const color = getLoopCoverColor(loop.id);
  return (
    <Link to={loopDetailPath(loop.id)} className={styles.loopRow}>
      <div
        className={styles.loopCover}
        style={url ? { backgroundImage: `url(${url})` } : { backgroundColor: color }}
      />
      <div className={styles.loopMeta}>
        <span className={styles.loopTitle}>{loop.title || 'Untitled'}</span>
        <span className={styles.loopSub}>
          {[loop.bpm ? `${loop.bpm}bpm` : null, loop.key || null].filter(Boolean).join(' ') || '—'}
        </span>
      </div>
      <div className={styles.loopMetric}>
        <strong>{metric}</strong>
        <span>{metricLabel}</span>
      </div>
    </Link>
  );
};

const Statistics = () => {
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState<StatsPayload>(emptyStats);
  const [history, setHistory] = useState<HistoryPayload>({
    likes_over_time: [],
    loops_over_time: [],
    plays_over_time: [],
    downloads_over_time: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsRes, historyRes] = await Promise.all([
          api.getUserStats(token),
          api.getUserStatsHistory(token, period),
        ]);
        if (cancelled) return;
        setStats({ ...emptyStats, ...statsRes });
        setHistory({
          likes_over_time: historyRes.likes_over_time || [],
          loops_over_time: historyRes.loops_over_time || [],
          plays_over_time: historyRes.plays_over_time || [],
          downloads_over_time: historyRes.downloads_over_time || [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить аналитику');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, period]);

  const playsChart = useMemo(
    () =>
      (history.plays_over_time || []).map((item) => ({
        date: formatAxisDate(item.date, period),
        plays: Number(item.count) || 0,
        listen: Math.round(Number(item.listen_seconds) || 0),
      })),
    [history.plays_over_time, period],
  );

  const likesChart = useMemo(
    () =>
      (history.likes_over_time || []).map((item) => ({
        date: formatAxisDate(item.date, period),
        value: Number(item.count) || 0,
      })),
    [history.likes_over_time, period],
  );

  const downloadsChart = useMemo(
    () =>
      (history.downloads_over_time || []).map((item) => ({
        date: formatAxisDate(item.date, period),
        value: Number(item.count) || 0,
      })),
    [history.downloads_over_time, period],
  );

  const completionRate =
    stats.total_plays > 0 ? Math.round((stats.completed_plays / stats.total_plays) * 100) : 0;

  if (!token) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.state}>Войдите, чтобы увидеть статистику</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.state}>Загрузка…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.state}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Аналитика</h1>
        </div>
        <div className={styles.period}>
          {([
            ['day', 'День'],
            ['week', 'Неделя'],
            ['month', 'Месяц'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={period === key ? styles.periodActive : ''}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className={styles.kpiGrid}>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Прослушивания</span>
          <strong className={styles.kpiValue}>{stats.total_plays}</strong>
          <span className={styles.kpiHint}>{stats.unique_listeners} уникальных</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Среднее время</span>
          <strong className={styles.kpiValue}>{formatSeconds(stats.avg_listen_seconds)}</strong>
          <span className={styles.kpiHint}>за одно прослушивание</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Всего слушали</span>
          <strong className={styles.kpiValue}>{formatSeconds(stats.total_listen_seconds)}</strong>
          <span className={styles.kpiHint}>суммарно</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Дослушивания</span>
          <strong className={styles.kpiValue}>{completionRate}%</strong>
          <span className={styles.kpiHint}>{stats.completed_plays} из {stats.total_plays}</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Лайки</span>
          <strong className={styles.kpiValue}>{stats.total_likes}</strong>
          <span className={styles.kpiHint}>
            ср. {stats.avg_likes_per_loop.toFixed(1)} на луп
          </span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Скачивания</span>
          <strong className={styles.kpiValue}>{stats.total_downloads}</strong>
          <span className={styles.kpiHint}>{stats.total_comments} комментариев</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Лупы</span>
          <strong className={styles.kpiValue}>{stats.total_loops}</strong>
          <span className={styles.kpiHint}>{formatFileSize(stats.total_file_size)}</span>
        </article>
        <article className={styles.kpi}>
          <span className={styles.kpiLabel}>Telegram</span>
          <strong className={styles.kpiValue}>{stats.total_telegram_clicks}</strong>
          <span className={styles.kpiHint}>клики по ссылкам</span>
        </article>
      </section>

      <section className={styles.charts}>
        <article className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Прослушивания</h2>
          {playsChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={playsChart}>
                <defs>
                  <linearGradient id="playsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff215c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff215c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="plays" stroke="#ff215c" fill="url(#playsFill)" strokeWidth={2} name="Плеи" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Пока нет данных</p>
          )}
        </article>

        <article className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Лайки</h2>
          {likesChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={likesChart}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#2558CF" radius={[6, 6, 0, 0]} name="Лайки" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Пока нет данных</p>
          )}
        </article>

        <article className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Скачивания</h2>
          {downloadsChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={downloadsChart}>
                <defs>
                  <linearGradient id="dlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#25cf83" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#25cf83" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={12} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke="#25cf83" fill="url(#dlFill)" strokeWidth={2} name="Скачивания" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Пока нет данных</p>
          )}
        </article>
      </section>

      <section className={styles.lists}>
        <article className={styles.listCard}>
          <h2 className={styles.cardTitle}>Самые прослушиваемые</h2>
          {stats.top_loops_by_plays.length ? (
            <div className={styles.loopList}>
              {stats.top_loops_by_plays.map((loop) => (
                <LoopMini
                  key={loop.id}
                  loop={loop}
                  metric={loop.plays || 0}
                  metricLabel="плеев"
                />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Загрузите лупы, чтобы увидеть топ</p>
          )}
        </article>

        <article className={styles.listCard}>
          <h2 className={styles.cardTitle}>Дольше всего слушают</h2>
          {stats.top_loops_by_listen.length ? (
            <div className={styles.loopList}>
              {stats.top_loops_by_listen.map((loop) => (
                <LoopMini
                  key={loop.id}
                  loop={loop}
                  metric={formatSeconds(loop.avg_listen_seconds || 0)}
                  metricLabel="в среднем"
                />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Пока мало данных по времени</p>
          )}
        </article>

        <article className={styles.listCard}>
          <h2 className={styles.cardTitle}>Топ по лайкам</h2>
          {stats.top_loops_by_likes.length ? (
            <div className={styles.loopList}>
              {stats.top_loops_by_likes.map((loop) => (
                <LoopMini
                  key={loop.id}
                  loop={loop}
                  metric={loop.likes || 0}
                  metricLabel="лайков"
                />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Пока нет лайков</p>
          )}
        </article>
      </section>
    </div>
  );
};

export default Statistics;
