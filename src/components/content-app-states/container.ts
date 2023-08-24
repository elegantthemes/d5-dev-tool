// External dependencies.
import { map } from 'lodash';

// Divi dependencies
import {
  withSelect,
  select,
} from '@divi/data';
import { SelectedModules } from '@divi/events';

// Local dependencies.
import { ContentAppStates } from './component';

/**
 * Container component for the ContentAppStates component.
 */
export const ContentAppStatesContainer = withSelect((selectStore: typeof select) => {
  const eventsStoreSelectors = selectStore('divi/events');

  // Module ids.
  const getModuleIds = (modules: SelectedModules) => map(modules, module => module?.id);

  return {
    attributeState: selectStore('divi/app-ui').getAttributeState(),
    breakpoint: selectStore('divi/app-ui').getBreakpoint(),
    selectedModules: getModuleIds(eventsStoreSelectors.getSelectedModules(false)),
    view: selectStore('divi/app-ui').getView(),
  };
})(ContentAppStates);
