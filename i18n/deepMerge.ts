import type { TranslationTree } from './types';

export function deepMerge(...objects: TranslationTree[]): TranslationTree {
  const result: TranslationTree = {};

  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const existing = result[key];

      if (
        value &&
        typeof value === 'object' &&
        existing &&
        typeof existing === 'object'
      ) {
        result[key] = deepMerge(existing as TranslationTree, value as TranslationTree);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}
