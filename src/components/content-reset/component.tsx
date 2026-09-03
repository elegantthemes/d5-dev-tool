// External dependencies.
import React, { ReactElement } from 'react';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies (accessed via window at runtime).
const IconSvg = (window as any)?.divi?.iconLibrary?.IconSvg;

// Local dependencies.
import { ContentResetProps, ResetAction } from './types';
import './styles.scss';

interface ResetButtonConfig {
  action: ResetAction;
  label: string;
  description: string;
}

const resetButtons: ResetButtonConfig[] = [
  {
    action: 'global-variables',
    label: __('Reset Global Variables', 'divi-5-dev-tool'),
    description: __('Remove all user-created global variables and return to the initial state.', 'divi-5-dev-tool'),
  },
  {
    action: 'module-presets',
    label: __('Reset Module Presets', 'divi-5-dev-tool'),
    description: __('Remove all user-created module presets.', 'divi-5-dev-tool'),
  },
  {
    action: 'group-presets',
    label: __('Reset Group Presets', 'divi-5-dev-tool'),
    description: __('Remove all user-created group presets.', 'divi-5-dev-tool'),
  },
];

/**
 * Component for resetting user-created global data.
 */
export const ContentReset = ({
  isResetting,
  pendingReset,
  error,
  successMessage,
  onResetClick,
  onConfirmReset,
  onCancelReset,
}: ContentResetProps): ReactElement => {
  return (
    <div className="d5-dev-tool-reset">
      <div className="d5-dev-tool-reset-header">
        <div className="d5-dev-tool-reset-header-title">
          {__('Reset', 'divi-5-dev-tool')}
        </div>
      </div>

      {error && (
        <div className="d5-dev-tool-reset-error">
          <strong>{__('Error:', 'divi-5-dev-tool')}</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="d5-dev-tool-reset-success">
          {successMessage}
        </div>
      )}

      <div className="d5-dev-tool-reset-actions">
        {resetButtons.map(({ action, label, description }) => {
          const isPending = pendingReset === action;
          const isLoading = isResetting === action;

          return (
            <div key={action} className="d5-dev-tool-reset-action">
              <div className="d5-dev-tool-reset-action-content">
                <div className="d5-dev-tool-reset-action-label">{label}</div>
                <div className="d5-dev-tool-reset-action-description">{description}</div>
              </div>
              <div className="d5-dev-tool-reset-action-buttons">
                {!isPending && (
                  <button
                    type="button"
                    className="d5-dev-tool-btn d5-dev-tool-btn--delete"
                    onClick={() => onResetClick(action)}
                    disabled={isLoading || isResetting !== null}
                  >
                    {IconSvg && <IconSvg name="divi/delete" viewBox="6 6 16 16" size={6} />}
                    {label}
                  </button>
                )}
                {isPending && (
                  <>
                    <button
                      type="button"
                      className="d5-dev-tool-btn d5-dev-tool-btn--confirm-delete"
                      onClick={() => onConfirmReset(action)}
                      disabled={isLoading}
                    >
                      {IconSvg && <IconSvg name="divi/check" size={6} />}
                      {__('Confirm', 'divi-5-dev-tool')}
                    </button>
                    <button
                      type="button"
                      className="d5-dev-tool-btn d5-dev-tool-btn--cancel"
                      onClick={onCancelReset}
                      disabled={isLoading}
                    >
                      {IconSvg && <IconSvg name="divi/close" size={6} />}
                      {__('Cancel', 'divi-5-dev-tool')}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
