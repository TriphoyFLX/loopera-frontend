import type { Locale } from '../types';
import en from './en/index';
import ru from './ru/index';

export const locales = { ru, en } as const;

export function detectLocale(): Locale {
  const stored = localStorage.getItem('loopera_locale');
  if (stored === 'ru' || stored === 'en') {
    return stored;
  }

  const lang = navigator.language.toLowerCase();
  return lang.startsWith('ru') ? 'ru' : 'en';
}
