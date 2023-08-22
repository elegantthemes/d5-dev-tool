// External dependencies.
import React, { ReactElement } from 'react';
import {
  forEach,
  get,
  includes,
  isEmpty,
  isString,
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
  BodyPanelWrapperContainer,
  PanelContainer,
} from '@divi/modal';
import { ObjectRenderer } from '@divi/object-renderer';
import { ErrorBoundary } from '@divi/error-boundary';

// Local dependencies.
import { ContentPanel } from '../content-panel';
import { ContentPanelWrapper } from '../content-panel-wrapper';
import {
  DevStateMonitorProps,
  ModuleProps,
} from './types';
import './styles.scss';

const ScriptList = ({ scripts }: { scripts: DevStateMonitorProps['scripts'] }) => {
  const scriptList: ReactElement[] = [];

  forEach(scripts, (scriptItems, scriptName) => {
    const scriptItem = (
      <div key={`state-monitor-script-${scriptName}`} className="et-vb-dev-state-monitor-script">
        <h2 className="et-vb-dev-state-monitor-script-heading">{scriptName}</h2>
        <ObjectRenderer values={scriptItems} />
      </div>
    );

    scriptList.push(scriptItem);
  });

  return (<div>{scriptList}</div>);
}

const DevStateMonitor = (props: DevStateMonitorProps) => {
  const {
    name,
    modules,
    globalModules,
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
    tab,
    serializedLayout,
    scripts,
  } = props;
  // State badge component.
  const StateBadge = (active: boolean, slug: string, label: string = '') => (
    ! active ? null : (
      <span className={`et-devtool-state-monitor-module--state-${slug}`}>
        {slug}{label}
      </span>
    )
  );

  // Recursive module list component.
  const Module = ({ module }: ModuleProps) => {
    // Hover state.
    const isHovered    = get(hoveredModule, 'id') === module?.id;
    const stateHovered = StateBadge(isHovered, 'hovered');

    // Selected state.
    const isSelected    = includes(selectedModules, module?.id);
    const stateSelected = StateBadge(isSelected, 'selected');

    // Dragged state
    const isDragged    = includes(draggedModules, module?.id);
    const stateDragged = StateBadge(isDragged, 'dragged');

    // Right click state.
    const isRightClicked    = rightClickedModuleId === module?.id;
    const stateRightClicked = StateBadge(isRightClicked, 'right-clicked');

    // Cliboard state
    const isOnClipboard    = get(lastModuleClipboard, ['id']) === module?.id;
    const stateOnClipboard = StateBadge(isOnClipboard, 'on-clipboard');

    // Edited state
    const isEdited    = module?.id === activeModalSetting;
    const stateEdited = StateBadge(isEdited, 'edited');

    // Global module state.
    const globalId = module?.props?.attrs?.globalModule;
    const isGlobal = isString(globalId) && '' !== globalId;
    const stateGlobal = StateBadge(isGlobal, 'global', `- ${globalId}`);

    // Props monitor
    const isPropsExpanded = includes(expandedModuleIds, module?.id);
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
          <span className="et-devtool-state-monitor-module--name">{module?.name}</span>
          <span
            className="et-devtool-state-monitor-module--id"
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
          <div className="et-devtool-state-monitor-module-state">
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
        <div className="et-devtool-state-monitor-module--children">
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
        modalActiveTab={tab ? tab : 'states'}
        multiPanels
      >
        <Header
          name={__('State Monitor', 'et_builder')}
        />
        <BodyPanelWrapperContainer>
          <PanelContainer id="states" label={__('States', 'et_builder')}>
            <div style={{
              padding: '20px 20px 40px 20px',
            }}
            >
              <ContentPanelWrapper>
                <ContentPanel id="layout" label={__('Layout', 'et_builder')}>
                  <Module module={modules.root} />
                </ContentPanel>
                <ContentPanel id="saved" label={__('Saved', 'et_builder')}>
                  <pre>{serializedLayout}</pre>
                </ContentPanel>
                <ContentPanel id="scripts" label={__('Scripts', 'et_builder')}>
                  <ScriptList scripts={scripts} />
                </ContentPanel>
                <ContentPanel id="global" label={__('Global', 'et_builder')}>
                  {globalModules.map(globalModule => (
                    <div
                      key={`global-module-item-${globalModule?.id}`}
                      className="et-devtool-state-monitor-global-module-item"
                    >
                      <h3>id: {globalModule?.id}</h3>
                      <Module module={globalModule?.content?.root} />
                    </div>
                  ))}
                </ContentPanel>
                <ContentPanel id="app-state" label={__('App State', 'et_builder')}>
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
                  </div>
                </ContentPanel>
                <ContentPanel id="keyboard" label={__('Keyboard', 'et_builder')}>
                  <div
                    className={classnames({
                      'et-devtool-state-monitor-overview': true,
                    })}
                  >
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
                          {currentShortcut?.name}
                        </pre>
                      </div>
                    </div>
                  </div>
                </ContentPanel>
              </ContentPanelWrapper>
            </div>
          </PanelContainer>
          <PanelContainer id="tools" label={__('Tools', 'et_builder')}>
            <div style={{ padding: '15px' }}>
              Coming Soon
            </div>
          </PanelContainer>
          <PanelContainer id="references" label={__('References', 'et_builder')}>
            <div style={{ padding: '15px' }}>
              Coming Soon
            </div>
          </PanelContainer>
        </BodyPanelWrapperContainer>
      </WrapperContainer>
    </ErrorBoundary>
  );
};

export {
  DevStateMonitor,
};
