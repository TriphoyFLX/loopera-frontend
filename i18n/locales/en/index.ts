import type { TranslationTree } from '../../types';
import { deepMerge } from '../../deepMerge';
import core from './core';
import extra from './extra';

const en: TranslationTree = deepMerge(core, extra);

export default en;
