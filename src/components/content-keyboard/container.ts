// Divi dependencies
import {
  withSelect,
  select,
} from '@divi/data';

// Local dependencies.
import { ContentKeyboard } from './component';

/**
 * Container component for the ContentKeyboard component.
 */
export const ContentKeyboardContainer = withSelect((selectStore: typeof select) => ({
  pressedKeys: selectStore('divi/keyboard-shortcuts').getPressedKeys(),
  currentShortcut: selectStore('divi/keyboard-shortcuts').getCurrentShortcut(),
}))(ContentKeyboard);
