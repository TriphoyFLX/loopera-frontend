export type Locale = 'ru' | 'en';

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};
