// External dependencies.
import {
  ImmutableArray,
  ImmutableObject,
} from 'seamless-immutable';

// Divi dependencies.
import { Shortcut } from '@divi/keyboard-shortcuts';

export interface ContentKeyboardProps {
  pressedKeys: ImmutableArray<string>;
  currentShortcut: ImmutableObject<Shortcut>;
}