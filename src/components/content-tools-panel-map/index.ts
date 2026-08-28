// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentResetContainer } from '../content-reset';

/**
 * Map of Tools panel tabs.
 */
export const toolsPanelMap = [
  {
    id: 'reset',
    label: __('Reset', 'et_builder'),
    component: ContentResetContainer,
  },
];
