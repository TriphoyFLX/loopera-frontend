import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MobileSearchBar.module.css';

type Props = {
  placeholder?: string;
  initialQuery?: string;
  filterTo?: string;
  onSubmitQuery?: (q: string) => void;
};

const MobileSearchBar = ({
  placeholder = 'В каком тайпе хотите услышать луп',
  initialQuery = '',
  filterTo = '/loops',
  onSubmitQuery,
}: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (onSubmitQuery) {
      onSubmitQuery(q);
      return;
    }
    if (!q) {
      navigate(filterTo);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form className={styles.search} onSubmit={submit}>
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск"
      />
      <button
        type="button"
        className={styles.filter}
        aria-label="Фильтры"
        onClick={() => navigate(filterTo)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
};

export default MobileSearchBar;
