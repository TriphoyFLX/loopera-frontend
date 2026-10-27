import type { TranslationTree } from '../../types';
import { deepMerge } from '../../deepMerge';
import core from './core';
import extra from './extra';

const ru: TranslationTree = deepMerge(core, extra);

export default ru;
