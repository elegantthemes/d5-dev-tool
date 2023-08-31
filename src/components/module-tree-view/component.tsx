// External dependencies.
import React, { ReactElement } from 'react';
import {
  get,
  includes,
  isEmpty,
  isString,
  noop,
  without,
} from 'lodash';
import classnames from 'classnames';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import { ModuleTreeViewProps } from './types';

/**
 * State badge component.
 */
const StateBadge = (active: boolean, slug: string, label: string = '') => (
  !active ? null : (
    <span className={`d5-dev-tool-module--state-${slug}`}>
      {slug}{label}
    </span>
  )
);

/**
 * Component for displaying layout content
 */
export const ModuleTreeView = ({
  activeModalSetting,
  draggedModules,
  expandedModuleIds,
  hoveredModule,
  lastModuleClipboard,
  modules,
  root,
  rightClickedModuleId,
  selectedModules,
  setExpandedModuleIds,
}: ModuleTreeViewProps): ReactElement => {
  // Recursive module list component.
  const Module = ({ module }: {
    module: ModuleTreeViewProps['root']
  }) => {
    // Hover state.
    const isHovered = get(hoveredModule, 'id') === module?.id;
    const stateHovered = StateBadge(isHovered, 'hovered');

    // Selected state.
    const isSelected = includes(selectedModules, module?.id);
    const stateSelected = StateBadge(isSelected, 'selected');

    // Dragged state
    const isDragged = includes(draggedModules, module?.id);
    const stateDragged = StateBadge(isDragged, 'dragged');

    // Right click state.
    const isRightClicked = rightClickedModuleId === module?.id;
    const stateRightClicked = StateBadge(isRightClicked, 'right-clicked');

    // Cliboard state
    const isOnClipboard = get(lastModuleClipboard, ['id']) === module?.id;
    const stateOnClipboard = StateBadge(isOnClipboard, 'on-clipboard');

    // Edited state
    const isEdited = module?.id === activeModalSetting;
    const stateEdited = StateBadge(isEdited, 'edited');

    // Global module state.
    const globalId = module?.props?.attrs?.globalModule;
    const isGlobal = isString(globalId) && '' !== globalId;
    const stateGlobal = StateBadge(isGlobal, 'global', `- ${globalId}`);

    // Props monitor
    const isPropsExpanded = includes(expandedModuleIds, module?.id);
    const propsMonitor = !isPropsExpanded
      ? null
      : (
        <div className="d5-dev-tool-module-props">
          <ObjectRenderer values={module} />
        </div>
      );

    return (
      <div className={classnames({
        'd5-dev-tool-module': true,
        'd5-dev-tool-module--hovered': isHovered,
        'd5-dev-tool-module--selected': isSelected,
        'd5-dev-tool-module--dragged': isDragged,
        'd5-dev-tool-module--right-clicked': isRightClicked,
        'd5-dev-tool-module--on-clipboard': isOnClipboard,
        'd5-dev-tool-module--edited': isEdited,
      })}
      >
        <div className="d5-dev-tool-module-meta">
          <span className="d5-dev-tool-module--name">{module?.name}</span>
          <span
            className="d5-dev-tool-module--id"
            role="button"
            tabIndex={0}
            onKeyPress={noop}
            onClick={() => {
              const updatedExpandedModuleIds = isPropsExpanded
                ? without(expandedModuleIds, module?.id)
                : [].concat(expandedModuleIds).concat(module?.id);

              setExpandedModuleIds(updatedExpandedModuleIds);
            }}
          >
            {module?.id}

          </span>
          <div className="d5-dev-tool-module-state">
            {stateGlobal}
            {stateSelected}
            {stateDragged}
            {stateRightClicked}
            {stateOnClipboard}
            {stateEdited}
            {stateHovered}
          </div>
        </div>
        {propsMonitor}
        <div className="d5-dev-tool-module--children">
          {(
            isEmpty(module?.children) ? null : module?.children?.map((childId: string) => (
              <Module
                key={`et-devtool-module-${childId}`}
                module={modules[childId]}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return <Module module={root} />
}