// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentLayoutContainer } from '../content-layout';
import { ContentSavedContainer } from '../content-saved'
import { ContentScriptsContainer } from '../content-scripts';
import { ContentAppStatesContainer } from '../content-app-states';
import { ContentKeyboardContainer } from '../content-keyboard';
import { ContentGlobalContainer } from '../content-global';
import { ContentClipboardContainer } from '../content-clipboard';
import { ContentEventsContainer } from '../content-events'
import { ContentDiviOptionsContainer } from '../content-divi-options';
import { ContentPresetsContainer } from '../content-presets';

/**
 * Map of content panels component.
 */
export const contentPanelMap = [
  {
    id: 'layout',
    label: __('Layout', 'et_builder'),
    component: ContentLayoutContainer,
  },
  {
    id: 'saved',
    label: __('Saved Content', 'et_builder'),
    component: ContentSavedContainer,
  },
  {
    id: 'scripts',
    label: __('Scripts', 'et_builder'),
    component: ContentScriptsContainer,
  },
  {
    id: 'global',
    label: __('Global', 'et_builder'),
    component: ContentGlobalContainer,
  },
  {
    id: 'app-state',
    label: __('App State', 'et_builder'),
    component: ContentAppStatesContainer,
  },
  {
    id: 'events',
    label: __('Events', 'et_builder'),
    component: ContentEventsContainer,
  },
  {
    id: 'keyboard',
    label: __('Keyboard', 'et_builder'),
    component: ContentKeyboardContainer,
  },
  {
    id: 'clipboard',
    label: __('Clipboard', 'et_builder'),
    component: ContentClipboardContainer,
  },
  {
    id: 'divi-options',
    label: __('Divi Options', 'et_builder'),
    component: ContentDiviOptionsContainer,
  },
  {
    id: 'presets',
    label: __('Presets', 'et_builder'),
    component: ContentPresetsContainer,
  },
];