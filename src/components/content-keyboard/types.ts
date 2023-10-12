// External dependencies.
import {
  ImmutableArray,
  ImmutableObject,
} from 'seamless-immutable';

// Divi dependencies.
import { KeyboardShortcuts } from '@divi/types';

export interface ContentKeyboardProps {
  pressedKeys: ImmutableArray<string>;
  currentShortcut: ImmutableObject<KeyboardShortcuts.Shortcut>;
}