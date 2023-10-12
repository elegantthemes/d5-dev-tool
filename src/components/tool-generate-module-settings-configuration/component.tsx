import React, {
  ReactElement,
  useState,
  ComponentProps,
} from 'react';
import { forEach } from 'lodash';

import { __ } from '@wordpress/i18n';

import {
  SelectContainer
} from '@divi/field-library';
import {
  generateModuleSettingsConfiguration,
  ModuleCollections,
} from '@divi/module-library';
import { FieldLibrary } from '@divi/types';

import './styles.scss';

/**
 * Stringify value into string with consistent format
 *
 * @param {object} initialValue
 *
 * @returns {string}
 */
const stringify = (initialValue: unknown): string => JSON.stringify(initialValue, null, 2);

/**
 * Tool panel for generating module settings configuration.
 *
 * @since ??
 *
 * @param {object} param0 Object of module metadata.
 *
 * @returns {ReactElement}
 */
export const ToolGenerateModuleSettingsConfiguration = ({
  modules,
}: {
  modules: ModuleCollections,
}): ReactElement => {
  // Default selected module.
  const defaultSelectedModule = "divi/cta";

  // States.
  const [
    selectedModule,
    setSelectedModule,
  ] = useState(defaultSelectedModule);
  const [
    editorValue,
    setEditorValue,
  ] = useState(
    stringify(modules?.[defaultSelectedModule])
  );
  const [
    moduleSettingsConfiguration,
    setModuleSettingsConfiguration
  ] = useState({});

  // Select options for selecting module.
  const options: ComponentProps<typeof SelectContainer>['options'] = {};

  forEach(modules, (module, moduleName: string) => {
    options[moduleName] = {
      label: moduleName,
      name: moduleName,
    };
  });

  return (
    <div className="tool-generate-module-settings-configuration">
      <blockquote className="info">
        <p>{__('Select a module to copy its metadata into textarea below it. You can edit the metadata value if it does not generate expected module settings configuration yet. Once the metadata looks ok, you can click the "Convert into Module Settings Configuration" button to convert the metadata into module settings configuration.')}</p>
      </blockquote>

      <p className="field-label">{__('Select module', 'divi-5-dev-tool')}</p>
      <div className="select-module-wrapper">
        <SelectContainer
          options={options}
          value={selectedModule}
          onChange={(params: FieldLibrary.Select.OnChangeCallbackParams) => {
            const changedModule = params?.inputValue;

            // Reset converted module if selected module is changed.
            if (selectedModule !== changedModule) {
              setModuleSettingsConfiguration({});
            }

            // Set currently selected module
            setSelectedModule(changedModule);

            // Automatically update codeeditor / textarea
            setEditorValue(stringify(modules?.[changedModule]));
          }}
        />
      </div>
      <div className="edit-metadata-wrapper">
        <p className="field-label">{__('Module metadata (editable)', 'divi-5-dev-tool')}</p>
        <textarea
          value={editorValue}
          onChange={(event) => {
            setEditorValue(event?.target?.value);
          }}
        />
      </div>
      <div className="convert-metadata-into-module-settings-configuration">
        <button
          className="convert-button"
          onClick={(event) => {
            event.preventDefault();

            const convertedValue = generateModuleSettingsConfiguration(JSON.parse(editorValue));

            setModuleSettingsConfiguration(convertedValue);
          }}
        >{__('Convert Into Module Settings Configuration ↓', 'divi-5-dev-tool')}</button>
      </div>
      <pre
        className="module-settings-configuration"
      >{stringify(moduleSettingsConfiguration)}</pre>
    </div>
  );
}