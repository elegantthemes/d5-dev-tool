// External dependencies.
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

// Local dependencies.
import { ContentPresets } from './component';
import { PresetsData } from './types';

// Global types.
declare global {
  interface Window {
    divi5DevToolAjax?: {
      ajaxUrl: string;
      nonce: string;
    };
  }
}

/**
 * Container component for the ContentPresets component.
 */
export const ContentPresetsContainer = () => {
  const [presets, setPresets] = useState<PresetsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ajaxConfig = window.divi5DevToolAjax;

  /**
   * Fetch all presets from WordPress.
   */
  const fetchPresets = useCallback(async () => {
    if (!ajaxConfig) {
      setError('AJAX configuration not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_get_presets');
      formData.append('nonce', ajaxConfig.nonce);

      const response = await fetch(ajaxConfig.ajaxUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPresets(result.data || null);
      } else {
        setError(result.data?.message || 'Failed to fetch presets');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [ajaxConfig]);

  /**
   * Update a preset.
   */
  const updatePreset = useCallback(async (key: string, value: unknown, nestedKeys: string[] = []) => {
    if (!ajaxConfig) {
      throw new Error('AJAX configuration not available');
    }

    try {
      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_update_preset');
      formData.append('nonce', ajaxConfig.nonce);
      formData.append('key', key);
      formData.append('value', typeof value === 'object' ? JSON.stringify(value) : String(value));

      if (nestedKeys.length > 0) {
        formData.append('nested_keys', JSON.stringify(nestedKeys));
      }

      console.log('Updating preset:', { key, value, nestedKeys });

      const response = await fetch(ajaxConfig.ajaxUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Update result:', result);

      if (!result.success) {
        throw new Error(result.data?.message || 'Failed to update preset');
      }

      // Refresh presets after successful update
      await fetchPresets();
    } catch (error) {
      console.error('Update preset error:', error);
      throw error;
    }
  }, [ajaxConfig, fetchPresets]);

  /**
   * Delete a preset.
   */
  const deletePreset = useCallback(async (key: string, nestedKeys: string[] = []) => {
    if (!ajaxConfig) {
      throw new Error('AJAX configuration not available');
    }

    try {
      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_delete_preset');
      formData.append('nonce', ajaxConfig.nonce);
      formData.append('key', key);

      if (nestedKeys.length > 0) {
        formData.append('nested_keys', JSON.stringify(nestedKeys));
      }

      console.log('Deleting preset:', { key, nestedKeys });

      const response = await fetch(ajaxConfig.ajaxUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);

      if (!result.success) {
        throw new Error(result.data?.message || 'Failed to delete preset');
      }

      // Refresh presets after successful deletion
      await fetchPresets();
    } catch (error) {
      console.error('Delete preset error:', error);
      throw error;
    }
  }, [ajaxConfig, fetchPresets]);

  /**
   * Refresh presets.
   */
  const refreshPresets = useCallback(async () => {
    await fetchPresets();
  }, [fetchPresets]);

  // Fetch presets on component mount
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  return ContentPresets({
    presets,
    isLoading,
    error,
    updatePreset,
    deletePreset,
    refreshPresets,
  });
};
