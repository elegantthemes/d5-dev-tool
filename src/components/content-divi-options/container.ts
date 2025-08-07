// External dependencies.
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

// Local dependencies.
import { ContentDiviOptions } from './component';
import { DiviOptionsData } from './types';

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
 * Container component for the ContentDiviOptions component.
 */
export const ContentDiviOptionsContainer = () => {
  const [diviOptions, setDiviOptions] = useState<DiviOptionsData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const ajaxConfig = window.divi5DevToolAjax;

  /**
   * Fetch Divi options from WordPress.
   */
  const fetchDiviOptions = useCallback(async () => {
    if (!ajaxConfig) {
      setError('AJAX configuration not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_get_divi_options');
      formData.append('nonce', ajaxConfig.nonce);

      const response = await fetch(ajaxConfig.ajaxUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setDiviOptions(result.data || {});
      } else {
        setError(result.data?.message || 'Failed to fetch Divi options');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [ajaxConfig]);

  /**
   * Update a Divi option.
   */
    const updateOption = useCallback(async (key: string, value: unknown, nestedKeys: string[] = []) => {
    if (!ajaxConfig) {
      throw new Error('AJAX configuration not available');
    }

    try {
      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_update_divi_option');
      formData.append('nonce', ajaxConfig.nonce);
      formData.append('key', key);
      formData.append('value', typeof value === 'object' ? JSON.stringify(value) : String(value));

      if (nestedKeys.length > 0) {
        formData.append('nested_keys', JSON.stringify(nestedKeys));
      }

      console.log('Updating option:', { key, value, nestedKeys });

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
        throw new Error(result.data?.message || 'Failed to update option');
      }

      // Refresh options after successful update
      await fetchDiviOptions();
    } catch (error) {
      console.error('Update option error:', error);
      throw error;
    }
  }, [ajaxConfig, fetchDiviOptions]);

  /**
   * Delete a Divi option.
   */
    const deleteOption = useCallback(async (key: string, nestedKeys: string[] = []) => {
    if (!ajaxConfig) {
      throw new Error('AJAX configuration not available');
    }

    try {
      const formData = new FormData();
      formData.append('action', 'divi_5_dev_tool_delete_divi_option');
      formData.append('nonce', ajaxConfig.nonce);
      formData.append('key', key);

      if (nestedKeys.length > 0) {
        formData.append('nested_keys', JSON.stringify(nestedKeys));
      }

      console.log('Deleting option:', { key, nestedKeys });

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
        throw new Error(result.data?.message || 'Failed to delete option');
      }

      // Refresh options after successful deletion
      await fetchDiviOptions();
    } catch (error) {
      console.error('Delete option error:', error);
      throw error;
    }
  }, [ajaxConfig, fetchDiviOptions]);

  /**
   * Refresh Divi options.
   */
  const refreshOptions = useCallback(async () => {
    await fetchDiviOptions();
  }, [fetchDiviOptions]);

  // Fetch options on component mount
  useEffect(() => {
    fetchDiviOptions();
  }, [fetchDiviOptions]);

  return ContentDiviOptions({
    diviOptions,
    isLoading,
    error,
    updateOption,
    deleteOption,
    refreshOptions,
  });
};
