// Divi dependencies.
import {
  withSelect,
  select,
} from '@divi/data';

// Local dependencies.
import { ContentClipboard } from './component';

/**
 * Container component for ContentClipboard
 */
export const ContentClipboardContainer = withSelect((selectStore: typeof select) => ({
  clipboardItems: selectStore('divi/clipboard').getItems(),
}))(ContentClipboard);
