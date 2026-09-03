// External dependencies.
import {
  useCallback,
  useState,
} from 'react';

// Local dependencies.
import { ContentReset } from './component';
import { ResetAction } from './types';

declare global {
  interface Window {
    divi5DevToolAjax?: {
      ajaxUrl: string;
      nonce: string;
    };
  }
}

const resetActionMap: Record<ResetAction, string> = {
  'global-variables': 'divi_5_dev_tool_reset_global_variables',
  'module-presets': 'divi_5_dev_tool_reset_module_presets',
  'group-presets': 'divi_5_dev_tool_reset_group_presets',
};

/**
 * Container component for the ContentReset component.
 */
export const ContentResetContainer = () => {
  const [isResetting, setIsResetting] = useState<ResetAction | null>(null);
  const [pendingReset, setPendingReset] = useState<ResetAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const ajaxConfig = window.divi5DevToolAjax;

  const onResetClick = useCallback((action: ResetAction) => {
    setError(null);
    setSuccessMessage(null);
    setPendingReset(action);
  }, []);

  const onCancelReset = useCallback(() => {
    setPendingReset(null);
  }, []);

  const onConfirmReset = useCallback(async (action: ResetAction) => {
    if (!ajaxConfig) {
      setError('AJAX configuration not available');
      setPendingReset(null);
      return;
    }

    try {
      setIsResetting(action);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('action', resetActionMap[action]);
      formData.append('nonce', ajaxConfig.nonce);

      const response = await fetch(ajaxConfig.ajaxUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.data?.message || 'Failed to reset data');
      }

      setSuccessMessage(result.data?.message || 'Reset completed successfully');
      setPendingReset(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPendingReset(null);
    } finally {
      setIsResetting(null);
    }
  }, [ajaxConfig]);

  return ContentReset({
    isResetting,
    pendingReset,
    error,
    successMessage,
    onResetClick,
    onConfirmReset,
    onCancelReset,
  });
};
