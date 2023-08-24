// Divi dependencies
import {
  withSelect,
  select,
} from '@divi/data';
import { } from '@divi/modal-library';

// Local dependencies.
import { ContentScripts } from './component';


/**
 * Container component for ContentScripts component.
 */
export const ContentScriptsContainer = withSelect((selectStore: typeof select) => ({
  scripts: selectStore('divi/module').getScripts(),
}))(ContentScripts);
