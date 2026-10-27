import type { TranslationTree } from './types';

export function resolveTranslation(
  tree: TranslationTree,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split('.');
  let current: string | TranslationTree | undefined = tree;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return key;
    }
    current = current[part];
  }

  if (typeof current !== 'string') {
    return key;
  }

  if (!vars) {
    return current;
  }

  return current.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`,
  );
}
