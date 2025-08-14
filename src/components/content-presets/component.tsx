// External dependencies.
import React, { ReactElement } from 'react';
import { isEmpty } from 'lodash';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies (accessed via window at runtime).
const IconSvg = (window as any)?.divi?.iconLibrary?.IconSvg;

// Local dependencies.
import { EditableObjectRenderer } from '../content-divi-options/editable-object-renderer';
import { ContentPresetsProps } from './types';
import './styles.scss';

/**
 * Component for displaying and editing all presets.
 */
export const ContentPresets = ({
  presets,
  isLoading,
  error,
  updatePreset,
  deletePreset,
  refreshPresets,
}: ContentPresetsProps): ReactElement => {

  // Loading state
  if (isLoading) {
    return (
      <div className="d5-dev-tool-presets-loading">
        {__('Loading presets...', 'divi-5-dev-tool')}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="d5-dev-tool-presets">
        <div className="d5-dev-tool-presets-error">
          <strong>{__('Error:', 'divi-5-dev-tool')}</strong> {error}
        </div>
        <button
          type="button"
          className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
          onClick={refreshPresets}
        >
          {IconSvg && <IconSvg name="divi/reset" size={6} />}
          {__('Retry', 'divi-5-dev-tool')}
        </button>
      </div>
    );
  }

  // Check if we have any preset data
  const hasData = presets && (
    !isEmpty(presets.data) ||
    !isEmpty(presets.legacyData)
  );

  // Empty state
  if (!hasData) {
    return (
      <div className="d5-dev-tool-presets">
        <div className="d5-dev-tool-presets-header">
          <div className="d5-dev-tool-presets-header-title">
            {__('Presets', 'divi-5-dev-tool')}
          </div>
          <div className="d5-dev-tool-presets-header-actions">
            <button
              type="button"
              className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
              onClick={refreshPresets}
              title={__('Refresh presets', 'divi-5-dev-tool')}
            >
              {IconSvg && <IconSvg name="divi/reset" size={6} />}
              {__('Refresh', 'divi-5-dev-tool')}
            </button>
          </div>
        </div>
        <div className="d5-dev-tool-presets-empty">
          {__('No presets found', 'divi-5-dev-tool')}
        </div>
      </div>
    );
  }

  return (
    <div className="d5-dev-tool-presets">
      <div className="d5-dev-tool-presets-header">
        <div className="d5-dev-tool-presets-header-title">
          {__('Presets', 'divi-5-dev-tool')}
        </div>
        <div className="d5-dev-tool-presets-header-actions">
          <button
            type="button"
            className="d5-dev-tool-btn d5-dev-tool-btn--refresh"
            onClick={refreshPresets}
            title={__('Refresh presets', 'divi-5-dev-tool')}
          >
            {IconSvg && <IconSvg name="divi/reset" size={6} />}
            {__('Refresh', 'divi-5-dev-tool')}
          </button>
        </div>
      </div>

      <div className="d5-dev-tool-presets-content">
        {presets && (
          <div className="d5-dev-tool-presets-sections">
            {/* Divi 5 Presets */}
            {!isEmpty(presets.data) && (
              <div className="d5-dev-tool-presets-section">
                <h3>{__('Divi 5 Presets', 'divi-5-dev-tool')}</h3>
                <EditableObjectRenderer
                  values={presets.data}
                  onUpdate={updatePreset}
                  onDelete={deletePreset}
                  maxDepth={15}
                />
              </div>
            )}

            {/* Legacy Divi 4 Presets */}
            {!isEmpty(presets.legacyData) && (
              <div className="d5-dev-tool-presets-section">
                <h3>
                  {__('Legacy Divi 4 Presets', 'divi-5-dev-tool')}
                  {presets.isLegacyDataImported && (
                    <span className="d5-dev-tool-presets-imported-badge">
                      {__('Imported', 'divi-5-dev-tool')}
                    </span>
                  )}
                </h3>
                <EditableObjectRenderer
                  values={presets.legacyData}
                  onUpdate={updatePreset}
                  onDelete={deletePreset}
                  maxDepth={15}
                />
              </div>
            )}

            {/* Import Status */}
            {!isEmpty(presets.legacyData) && (
              <div className="d5-dev-tool-presets-import-status">
                <p>
                  <strong>{__('Legacy Import Status:', 'divi-5-dev-tool')}</strong>{' '}
                  {presets.isLegacyDataImported
                    ? __('Legacy presets have been imported to Divi 5', 'divi-5-dev-tool')
                    : __('Legacy presets have not been imported yet', 'divi-5-dev-tool')
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
