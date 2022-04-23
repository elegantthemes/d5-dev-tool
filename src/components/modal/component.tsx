// External dependencies.
import React from 'react';
import {
  get,
  includes,
  isEmpty,
  map,
  noop,
  without,
} from 'lodash';
import classnames from 'classnames';

// WordPress dependencies
import { __ } from '@wordpress/i18n';

// Internal dependencies.
import {
  WrapperContainer,
  Header,
  BodyContainer,
  PanelContainer,
} from '@divi/modal';
import { ObjectRenderer } from '@divi/object-renderer';
import { ErrorBoundary } from '@divi/error-boundary';

// Local dependencies.
import './styles.scss';

const DevStateMonitor = (props) => {
  const {
    name,
    modules,
    hoveredModule,
    selectedModules,
    draggedModules,
    rightClickedModuleId,
    lastModuleClipboard,
    pressedKeys,
    currentShortcut,
    activeModalSetting,
    expandedModuleIds,
    setExpandedModuleIds,
    attributeState,
    breakpoint,
    view,
  } = props;

  // State badge component.
  const StateBadge = (active: boolean, slug: string) => (
    ! active ? null : (
      <span className={`et-devtool-state-monitor-module--state-${slug}`}>
        {slug}
      </span>
    )
  );

  // Recursive module list component.
  const Module = ({ module }) => {
    // Hover state.
    const isHovered    = get(hoveredModule, 'id') === module.id;
    const stateHovered = StateBadge(isHovered, 'hovered');

    // Selected state.
    const isSelected    = includes(selectedModules, module.id);
    const stateSelected = StateBadge(isSelected, 'selected');

    // Dragged state
    const isDragged    = includes(draggedModules, module.id);
    const stateDragged = StateBadge(isDragged, 'dragged');

    // Right click state.
    const isRightClicked    = rightClickedModuleId === module.id;
    const stateRightClicked = StateBadge(isRightClicked, 'right-clicked');

    // Cliboard state
    const isOnClipboard    = get(lastModuleClipboard, ['id']) === module.id;
    const stateOnClipboard = StateBadge(isOnClipboard, 'on-clipboard');

    // Edited state
    const isEdited    = module.id === activeModalSetting;
    const stateEdited = StateBadge(isEdited, 'edited');

    // Props monitor
    const isPropsExpanded = includes(expandedModuleIds, module.id);
    const propsMonitor    = ! isPropsExpanded
      ? null
      : (
        <div className="et-devtool-state-monitor-module-props">
          <ObjectRenderer values={module} />
        </div>
      );

    return (
      <div className={classnames({
        'et-devtool-state-monitor-module':                true,
        'et-devtool-state-monitor-module--hovered':       isHovered,
        'et-devtool-state-monitor-module--selected':      isSelected,
        'et-devtool-state-monitor-module--dragged':       isDragged,
        'et-devtool-state-monitor-module--right-clicked': isRightClicked,
        'et-devtool-state-monitor-module--on-clipboard':  isOnClipboard,
        'et-devtool-state-monitor-module--edited':        isEdited,
      })}
      >
        <div className="et-devtool-state-monitor-module-meta">
          <span className="et-devtool-state-monitor-module--name">{module.name}</span>
          <span
            className="et-devtool-state-monitor-module--id"
            role="button"
            tabIndex={0}
            onKeyPress={noop}
            onClick={() => {
              const updatedExpandedModuleIds = isPropsExpanded
                ? without(expandedModuleIds, module.id)
                : [].concat(expandedModuleIds).concat(module.id);

              setExpandedModuleIds(updatedExpandedModuleIds);
            }}
          >
            {module.id}

          </span>
          <div className="et-devtool-state-monitor-module-state">
            {stateHovered}
            {stateSelected}
            {stateDragged}
            {stateRightClicked}
            {stateOnClipboard}
            {stateEdited}
          </div>
        </div>
        {propsMonitor}
        <div className="et-devtool-state-monitor-module--children">
          {(
            isEmpty(module.children) ? null : module.children.map((childId: string) => (
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

  return (
    <ErrorBoundary
      key="et-vb-divi-modals--dev-state-monitor"
      componentName="et-vb-divi-modals--dev-state-monitor"
    >
      <WrapperContainer
        draggable
        resizable
        expandable
        snappable
        modalName={name}
      >
        <Header
          name={__('State Monitor', 'et_builder')}
        />
        <BodyContainer>
          <PanelContainer id="state-monitor" opened>
            <div style={{
              padding: '20px 20px 40px 20px',
            }}
            >
              <Module module={modules.root} />
              <div
                className={classnames({
                  'et-devtool-state-monitor-overview': true,
                })}
              >
                <div className="et-devtool-state-monitor-overview-view">
                  <h3>View</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    {view}
                  </div>
                </div>
                <div className="et-devtool-state-monitor-overview-breakpoint">
                  <h3>Breakpoint</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    {breakpoint}
                  </div>
                </div>
                <div className="et-devtool-state-monitor-overview-attribute-state">
                  <h3>Attribute State</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    {attributeState}
                  </div>
                </div>

                <div className="et-devtool-state-monitor-overview-selected">
                  <h3>Selected</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    {selectedModules.length}
                    {selectedModules.length > 1 ? ' Modules' : ' Module'}
                  </div>
                </div>
                <div className="et-devtool-state-monitor-overview-keypress">
                  <h3>Keypress</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    {map(pressedKeys, key => (
                      <kbd key={`et-devtool-state-monitor-overview-key-${key}`}>{key}</kbd>
                    ))}
                  </div>
                </div>
                <div className="et-devtool-state-monitor-overview-shortcut">
                  <h3>Shortcuts</h3>
                  <div className="et-devtool-state-monitor-overview-value">
                    <pre>
                      {currentShortcut.name}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </PanelContainer>
        </BodyContainer>
      </WrapperContainer>
    </ErrorBoundary>
  );
};

export {
  DevStateMonitor,
};