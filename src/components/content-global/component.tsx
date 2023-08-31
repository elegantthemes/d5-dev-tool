// External dependencies.
import React, { ReactElement } from 'react';

// Local dependencies.
import { ModuleTreeView } from '../module-tree-view';
import { ContentGlobalProps } from './types';


/**
 * Component for displaying global content
 */
export const ContentGlobal = ({
  activeModalSetting,
  draggedModules,
  expandedModuleIds,
  hoveredModule,
  lastModuleClipboard,
  modules,
  rightClickedModuleId,
  selectedModules,
  setExpandedModuleIds,
  globalModules,
}: ContentGlobalProps): ReactElement[] => (
  globalModules.map(globalModule => (
    <div
      key={`global-module-item-${globalModule?.id}`}
      className="d5-dev-tool-global-module-item"
    >
      <h3>id: {globalModule?.id}</h3>
      <ModuleTreeView
        activeModalSetting={activeModalSetting}
        draggedModules={draggedModules}
        expandedModuleIds={expandedModuleIds}
        hoveredModule={hoveredModule}
        lastModuleClipboard={lastModuleClipboard}
        modules={modules}
        root={globalModule?.content?.root}
        rightClickedModuleId={rightClickedModuleId}
        selectedModules={selectedModules}
        setExpandedModuleIds={setExpandedModuleIds}
      />
    </div>
  ))
);