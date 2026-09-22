// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';

// WordPress dependencies.
import { __, sprintf } from '@wordpress/i18n';

// Local dependencies.
import {
  CollapsibleObjectRenderer,
} from './collapsible-object-renderer';
import {
  CollapsibleControlSignal,
  ContentGlobalVariablesProps,
  GlobalVariableType,
  GlobalVariablesData,
} from './types';
import {
  getGroupEntryCount,
  getVariablesVisibleInDiviUI,
  GLOBAL_VARIABLE_GROUP_KEYS,
} from './utils/normalize-global-variables';
import '../content-divi-options/styles.scss';
import './styles.scss';

const GLOBAL_VARIABLE_TYPES: GlobalVariableType[] = GLOBAL_VARIABLE_GROUP_KEYS;

const GLOBAL_VARIABLE_TYPE_LABELS: Record<GlobalVariableType, string> = {
  numbers: __('Numbers', 'divi-5-dev-tool'),
  strings: __('Text', 'divi-5-dev-tool'),
  images: __('Images', 'divi-5-dev-tool'),
  links: __('Links', 'divi-5-dev-tool'),
  colors: __('Colors', 'divi-5-dev-tool'),
  fonts: __('Fonts', 'divi-5-dev-tool'),
  gradients: __('Gradients', 'divi-5-dev-tool'),
};

const getTypeLabel = (type: GlobalVariableType): string => GLOBAL_VARIABLE_TYPE_LABELS[type];

const hasGlobalVariableData = (globalVariables: GlobalVariablesData | null): boolean => {
  if (!globalVariables) {
    return false;
  }

  return GLOBAL_VARIABLE_TYPES.some((type) => getGroupEntryCount(globalVariables[type]) > 0);
};

/**
 * Component for displaying all global variables grouped by type.
 */
export const ContentGlobalVariables = ({
  globalVariables,
}: ContentGlobalVariablesProps): ReactElement => {
  const [treeControl, setTreeControl] = useState<CollapsibleControlSignal | null>(null);
  const hasData = hasGlobalVariableData(globalVariables);

  const handleCollapseAll = () => {
    setTreeControl({ action: 'collapse', token: Date.now() });
  };

  const handleExpandAll = () => {
    setTreeControl({ action: 'expand', token: Date.now() });
  };

  return (
    <div className="d5-dev-tool-global-variables">
      <div className="d5-dev-tool-global-variables-header">
        <div className="d5-dev-tool-global-variables-header-title">
          {__('Global Variables', 'divi-5-dev-tool')}
        </div>
        {hasData && (
          <div className="d5-dev-tool-global-variables-header-actions">
            <button
              type="button"
              className="d5-dev-tool-global-variables__tree-button"
              onClick={handleCollapseAll}
              title={__('Collapse', 'divi-5-dev-tool')}
            >
              {__('Collapse', 'divi-5-dev-tool')}
            </button>
            <button
              type="button"
              className="d5-dev-tool-global-variables__tree-button"
              onClick={handleExpandAll}
              title={__('Expand', 'divi-5-dev-tool')}
            >
              {__('Expand', 'divi-5-dev-tool')}
            </button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="d5-dev-tool-global-variables-empty">
          {__('No global variables found', 'divi-5-dev-tool')}
        </div>
      ) : (
        <div className="d5-dev-tool-global-variables-content">
          <div className="d5-dev-tool-global-variables-sections">
            {globalVariables && GLOBAL_VARIABLE_TYPES.map((type) => {
              const typeValues = globalVariables[type] ?? {};
              const entryCount = getGroupEntryCount(typeValues);
              const activeCount = getVariablesVisibleInDiviUI(typeValues).length;

              if (0 === entryCount) {
                return null;
              }

              return (
                <div className="d5-dev-tool-global-variables-section" key={type}>
                  <h3>
                    <span>
                      {getTypeLabel(type)}
                      {' '}
                      <span className="d5-dev-tool-global-variables-section-count">
                        {sprintf(
                          /* translators: 1: active variable count, 2: total variable count */
                          __('(%1$s active / %2$s total)', 'divi-5-dev-tool'),
                          activeCount,
                          entryCount,
                        )}
                      </span>
                    </span>
                  </h3>
                  {0 === activeCount && 0 < entryCount && (
                    <p className="d5-dev-tool-global-variables-section-note">
                      {__('All variables in this group are archived and hidden from the Variables modal.', 'divi-5-dev-tool')}
                    </p>
                  )}
                  <CollapsibleObjectRenderer
                    values={typeValues}
                    groupKey={type}
                    maxDepth={15}
                    parentControl={treeControl}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
