// Divi dependencies.
import {
  ModuleFlatObject,
  ModuleFlatObjects,
} from "@divi/types";
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events';

export interface ModuleProps {
  module: ModuleFlatObject;
}

export interface ContentLayoutProps {
  activeModalSetting?: string;
  draggedModules: string[],
  expandedModuleIds?: string[];
  hoveredModule: HoveredModule;
  lastModuleClipboard: SelectedModule;
  modules: ModuleFlatObjects;
  rightClickedModuleId: string;
  selectedModules: string[];
  setExpandedModuleIds: (moduleIds: string[]) => void;
}