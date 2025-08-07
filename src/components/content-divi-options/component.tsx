// External dependencies.
import React, { ReactElement } from 'react';
import { isEmpty } from 'lodash';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies (accessed via window at runtime).
const IconSvg = (window as any)?.divi?.iconLibrary?.IconSvg;

// Local dependencies.
import { EditableObjectRenderer } from './editable-object-renderer';
import { ContentDiviOptionsProps } from './types';
import './styles.scss';

/**
 * Component for displaying and editing Divi options.
 */
export const ContentDiviOptions = ({
  diviOptions,
  isLoading,
  error,
  updateOption,
  deleteOption,
  refreshOptions,
}: ContentDiviOptionsProps): ReactElement => {

  // Loading state
  if (isLoading) {
    return (
      <div className="d5-dev-tool-divi-options-loading">
        {__('Loading Divi options...', 'divi-5-dev-tool')}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="d5-dev-tool-divi-options">
        <div className="d5-dev-tool-divi-options-error">
          <strong>{__('Error:', 'divi-5-dev-tool')}</strong> {error}
        </div>
        <button
          type="button"
          className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
          onClick={refreshOptions}
        >
                        {IconSvg && <IconSvg name="divi/reset" size={6} />}
              {__('Retry', 'divi-5-dev-tool')}
        </button>
      </div>
    );
  }

  // Empty state
  if (isEmpty(diviOptions)) {
    return (
      <div className="d5-dev-tool-divi-options">
        <div className="d5-dev-tool-divi-options-header">
          <div className="d5-dev-tool-divi-options-header-title">
            {__('Divi Options', 'divi-5-dev-tool')}
          </div>
          <div className="d5-dev-tool-divi-options-header-actions">
            <button
              type="button"
              className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
              onClick={refreshOptions}
              title={__('Refresh options', 'divi-5-dev-tool')}
            >
              {IconSvg && <IconSvg name="divi/reset" size={6} />}
              {__('Refresh', 'divi-5-dev-tool')}
            </button>
          </div>
        </div>
        <div className="d5-dev-tool-divi-options-empty">
          {__('No Divi options found', 'divi-5-dev-tool')}
        </div>
      </div>
    );
  }

  return (
    <div className="d5-dev-tool-divi-options">
      <div className="d5-dev-tool-divi-options-header">
        <div className="d5-dev-tool-divi-options-header-title">
          {__('Divi Options', 'divi-5-dev-tool')}
        </div>
                  <div className="d5-dev-tool-divi-options-header-actions">
            <button
              type="button"
              className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
              onClick={refreshOptions}
              title={__('Refresh options', 'divi-5-dev-tool')}
            >
              {IconSvg && <IconSvg name="divi/reset" size={6} />}
              {__('Refresh', 'divi-5-dev-tool')}
            </button>
          </div>
      </div>

      <div className="d5-dev-tool-divi-options-content">
        <EditableObjectRenderer
          values={diviOptions}
          onUpdate={updateOption}
          onDelete={deleteOption}
          maxDepth={5}
        />
      </div>
    </div>
  );
};
