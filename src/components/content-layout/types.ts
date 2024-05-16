// Divi dependencies.
import {
  ModuleFlatObject,
  ModuleFlatObjects,
  type Events,
} from "@divi/types";

export interface ModuleProps {
  module: ModuleFlatObject;
}

export interface ContentLayoutProps {
  activeModalSetting?: string;
  draggedModules: string[],
  expandedModuleIds?: string[];
  hoveredModule: Events.Hovered.Module;
  lastModuleClipboard: Events.Store.ImmutableState['selectedModules'];
  modules: ModuleFlatObjects;
  rightClickedModuleId: string;
  selectedModules: string[];
  setExpandedModuleIds: (moduleIds: string[]) => void;
}