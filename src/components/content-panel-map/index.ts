import { createElement } from 'react';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentPostContent } from '../content-post-content';
import { ContentModuleCount } from '../content-module-count';
import { ContentSavedContainer } from '../content-saved'
import { ContentScriptsContainer } from '../content-scripts';
import { ContentAppStatesContainer } from '../content-app-states';
import { ContentKeyboardContainer } from '../content-keyboard';
import { ContentClipboardContainer } from '../content-clipboard';
import { ContentEventsContainer } from '../content-events'
import { ContentDiviOptionsContainer } from '../content-divi-options';
import { ContentPresetsContainer } from '../content-presets';
import { ContentGlobalModulesSyncWorthy } from '../content-global-modules-sync-worthy';
import { ContentGlobalModulesTemplates } from '../content-global-modules-templates';
import { ContentCanvasStates } from '../content-canvas-states';
import { ContentLayoutHistory } from '../content-layout-history';
import { ContentCanvasesHistory } from '../content-canvases-history';

const TBHeaderPanel = () => createElement(ContentPostContent, { layout: 'header' });
const TBBodyPanel = () => createElement(ContentPostContent, { layout: 'body' });
const TBFooterPanel = () => createElement(ContentPostContent, { layout: 'footer' });

/**
 * Map of content panels component.
 */
export const contentPanelMap = [
  {
    id: 'layout-post-content',
    label: __('Post Content', 'et_builder'),
    component: ContentPostContent,
  },
  {
    id: 'layout-tb-header',
    label: __('TB Header', 'et_builder'),
    component: TBHeaderPanel,
  },
  {
    id: 'layout-tb-body',
    label: __('TB Body', 'et_builder'),
    component: TBBodyPanel,
  },
  {
    id: 'layout-tb-footer',
    label: __('TB Footer', 'et_builder'),
    component: TBFooterPanel,
  },
  {
    id: 'module-count',
    label: __('Module Count', 'et_builder'),
    component: ContentModuleCount,
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
    id: 'global-modules-templates',
    label: __('Global Modules Templates', 'et_builder'),
    component: ContentGlobalModulesTemplates,
  },
  {
    id: 'global-modules-sync-worthy',
    label: __('Global Modules Sync Worthy Changes', 'et_builder'),
    component: ContentGlobalModulesSyncWorthy,
  },
  {
    id: 'app-state',
    label: __('App State', 'et_builder'),
    component: ContentAppStatesContainer,
  },
  {
    id: 'canvases',
    label: __('Canvases', 'et_builder'),
    component: ContentCanvasStates,
  },
  {
    id: 'layout-history',
    label: __('Layout History', 'et_builder'),
    component: ContentLayoutHistory,
  },
  {
    id: 'canvases-history',
    label: __('Canvases History', 'et_builder'),
    component: ContentCanvasesHistory,
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