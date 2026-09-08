// Divi dependencies.
import {
  select as storeSelect,
  useSelect,
} from '@divi/data';

// Local dependencies.
import { ContentGlobalVariables } from './component';
import { normalizeGlobalVariables } from './utils/normalize-global-variables';

/**
 * Container component for the ContentGlobalVariables component.
 */
export const ContentGlobalVariablesContainer = () => {
  const globalVariables = useSelect((selectStore: typeof storeSelect) =>
    normalizeGlobalVariables(selectStore('divi/global-data').getGlobalVariables()),
  );

  return ContentGlobalVariables({
    globalVariables,
  });
};
