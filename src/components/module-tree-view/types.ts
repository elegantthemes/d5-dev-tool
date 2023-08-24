// Divi dependencies.
import {
  ModuleFlatObject,
  ModuleFlatObjects,
} from "@divi/types";
import {
  HoveredModule,
  SelectedModule,
} from '@divi/events';

export interface ModuleTreeViewProps {
  activeModalSetting?: string;
  draggedModules: string[],
  expandedModuleIds?: string[];
  hoveredModule: HoveredModule;
  lastModuleClipboard: SelectedModule;
  modules: ModuleFlatObjects;
  root: ModuleFlatObject;
  rightClickedModuleId: string;
  selectedModules: string[];
  setExpandedModuleIds: (moduleIds: string[]) => void;
}