// External dependencies.
import {
  get,
  map,
} from 'lodash';

// Divi dependencies
import {
  dispatch,
  withSelect,
  select,
} from '@divi/data';
import { SelectedModules } from '@divi/events';

// Local dependencies.
import { ContentLayout } from './component';

export const name = 'divi/dev-state-monitor';
export const type = 'multi';

/**
 * Container component for the ContentLayout component.
 */
export const ContentLayoutContainer = withSelect((selectStore: typeof select) => {
  const editPostStoreSelectors = selectStore('divi/edit-post');
  const eventsStoreSelectors = selectStore('divi/events');
  const rightClickOptionsSelectors = selectStore('divi/right-click-options');
  const modalSelectors = selectStore('divi/modal-library');

  // Modal state.
  const modalState = modalSelectors.getActiveModal(type);

  // Expanded module ids
  const expandedModuleIds = get(modalState, [name, 'attributes', 'expandedModuleIds']);

  // Module modal state.
  const singleModalState = modalSelectors.getActiveModal('single');

  // Module ids.
  const getModuleIds = (modules: SelectedModules) => map(modules, module => module?.id);

  // Right clicks.
  const rightClick = rightClickOptionsSelectors.getState();
  const rightClickedModuleId = rightClick.active
    ? get(rightClick, ['owner', 'id'])
    : '';

  // Modules.
  const modules = editPostStoreSelectors.getContent();

  return {
    activeModalSetting: 'divi/module' === singleModalState?.name && singleModalState?.owner,
    draggedModules: getModuleIds(eventsStoreSelectors.getDraggedModules().asMutable({ deep: true })),
    expandedModuleIds,
    hoveredModule: eventsStoreSelectors.getHoveredModule(),

    // @todo (D5) to be updated once new selector has been made.
    lastModuleClipboard: {},
    modules,
    rightClickedModuleId,
    selectedModules: getModuleIds(eventsStoreSelectors.getSelectedModules(false)),
    setExpandedModuleIds: (moduleIds: string[]) => {
      dispatch('divi/modal-library').setAttributes({
        name: 'divi/dev-state-monitor',
        attributes: {
          expandedModuleIds: moduleIds,
        },
      });
    },
  };
})(ContentLayout);
