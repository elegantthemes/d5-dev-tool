// External dependencies.
import React, { ReactElement } from 'react';

// Divi dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ModuleTreeView } from '../module-tree-view';
import { ContentGlobalProps } from './types';
import './styles.scss';


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
}: ContentGlobalProps): ReactElement | ReactElement[] => {

  if (!globalModules?.length) {
    return (
      <div className="d5-dev-tool-no-items">
        {__('No global data found', 'divi-5-dev-tool')}
      </div>
    );
  }

  return (
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
  )
};