import {
  ModuleFlatObject,
  ModuleFlatObjects,
} from "@divi/types";
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events';


// @types/divi__global-layouts type package doesn't exist, so we'll manually create it.
interface GlobalLayoutItem {
  content: ModuleFlatObjects;
  modulesMap: ModuleFlatObjects[];
  owners: string[];
  id: string;
}

export interface ModuleProps {
  module: ModuleFlatObject;
}

export interface ContentGlobalProps {
  activeModalSetting?: string;
  draggedModules: string[],
  expandedModuleIds?: string[];
  hoveredModule: HoveredModule;
  lastModuleClipboard: SelectedModule;
  modules: ModuleFlatObjects;
  rightClickedModuleId: string;
  selectedModules: string[];
  setExpandedModuleIds: (moduleIds: string[]) => void;
  globalModules: GlobalLayoutItem[];
}