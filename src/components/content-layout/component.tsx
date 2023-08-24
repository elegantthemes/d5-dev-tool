// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { ModuleTreeView } from '../module-tree-view';
import { ContentLayoutProps } from './types';


/**
 * Component for displaying layout content
 */
export const ContentLayout = ({
  activeModalSetting,
  draggedModules,
  expandedModuleIds,
  hoveredModule,
  lastModuleClipboard,
  modules,
  rightClickedModuleId,
  selectedModules,
  setExpandedModuleIds,
}: ContentLayoutProps): ReactElement => (
  <ModuleTreeView
    activeModalSetting={activeModalSetting}
    draggedModules={draggedModules}
    expandedModuleIds={expandedModuleIds}
    hoveredModule={hoveredModule}
    lastModuleClipboard={lastModuleClipboard}
    modules={modules}
    root={modules.root}
    rightClickedModuleId={rightClickedModuleId}
    selectedModules={selectedModules}
    setExpandedModuleIds={setExpandedModuleIds}
  />
);