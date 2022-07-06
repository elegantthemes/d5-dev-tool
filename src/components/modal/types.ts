// External dependencies.
import {
  ImmutableArray,
  ImmutableObject,
} from 'seamless-immutable';

// Internal dependencies.
import {
  AttrState,
  Breakpoint,
  ModuleFlatObject,
  ModuleFlatObjects,
} from '@divi/types';
import { Shortcut } from '@divi/keyboard-shortcuts';
import { ViewType } from '@divi/app-ui';
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events';
import { ModalStates } from '@divi/modal';


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
