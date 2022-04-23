// External dependencies.
import {
  ImmutableArray,
  ImmutableObject,
} from 'seamless-immutable';

// Internal dependencies.
import {
  ModuleFlatObject,
  ModuleFlatObjects,
} from '@divi/edit-post/src/store/types';
import { Shortcut } from '@divi/keyboard-shortcuts/src/store/types';
import {
  AttrState,
  Breakpoint,
} from '@divi/types';
import { ViewType } from '@divi/app-ui/src/store/types';
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events/src/store/types';
import { ModalStates } from '@divi/modal-library/src/store/types';


export type ContaninerProps = ModalStates;

export interface DevStateMonitorProps {
  name: ModalStates['name'];
  modules: ModuleFlatObjects;
  hoveredModule: HoveredModule,
  selectedModules: string[],
  draggedModules: string[],
  rightClickedModuleId: string,
  lastModuleClipboard: SelectedModule,
  pressedKeys: ImmutableArray<string>;
  currentShortcut: ImmutableObject<Shortcut>;
  activeModalSetting?: string;
  expandedModuleIds?: string[];
  setExpandedModuleIds: (moduleIds: string[]) => void;
  attributeState: AttrState;
  breakpoint: Breakpoint;
  view: ViewType;
}

export interface ModuleProps {
  module: ModuleFlatObject;
}
