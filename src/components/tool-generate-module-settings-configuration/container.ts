// Divi dependencies
import {
  withSelect,
  select,
} from '@divi/data';
import { } from '@divi/modal-library';

// Local dependencies.
import { ToolGenerateModuleSettingsConfiguration } from './component';


/**
 * Container component for ToolGenerateModuleSettingsConfiguration component.
 */
export const ToolGenerateModuleSettingsConfigurationContainer = withSelect((selectStore: typeof select) => ({
  modules: selectStore('divi/module-library')?.getModules()?.asMutable({ deep: true }),
}))(ToolGenerateModuleSettingsConfiguration);
