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
import {
  ModuleStoreState
} from '@divi/module';
import { Shortcut } from '@divi/keyboard-shortcuts';
import { ViewType } from '@divi/types';
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events';
import { ModalStates } from '@divi/modal';

// @types/divi__global-layouts type package doesn't exist, so we'll manually create it.
interface GlobalLayoutItem {
  content: ModuleFlatObjects;
  modulesMap: ModuleFlatObjects[];
  owners: string[];
  id: string;
}

export type ContaninerProps = ModalStates;

export interface DevStateMonitorProps {
  name: ModalStates['name'];
  modules: ModuleFlatObjects;
  globalModules: GlobalLayoutItem[];
  scripts: ModuleStoreState['scripts'];
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
  tab: string;
}

export interface ModuleProps {
  module: ModuleFlatObject;
}
