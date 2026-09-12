import jQuery from 'jquery';
import { forEach } from 'lodash';

// Divi dependencies
import { registerBuilderBarButton } from '@divi/app-ui';
import { dispatch } from '@divi/data';

// WordPress dependencies.
import {
  addAction,
  didAction,
} from '@wordpress/hooks';
import {
  __,
  sprintf,
} from '@wordpress/i18n';

// Local dependencies
import {
  Divi5DevTool,
  name,
} from './components/modal';
import { contentPanelMap } from './components/content-panel-map';
import { aiAgentsPanelMap } from './components/content-ai-agents-panel-map';
import { toolsPanelMap } from './components/content-tools-panel-map';
import {
  createElement,
  ReactNode,
} from 'react';
import { PanelBasedModal } from './components/panel-based-modal';

declare global {
  interface Window {
    jQuery: typeof jQuery;
  }
}

/**
 * Register dev tool builder bar button and modals.
 *
 * @since ??
 */
const registerDevTool = () => {
  // Toggle function for the dev tool.
  const toggleDevTool = () => {
    const isDevToolOpen = (window.divi as any).data.select('divi/modal-library').isModalActive(name);

    if (isDevToolOpen) {
      dispatch('divi/modal-library').close({ name });
    } else {
      dispatch('divi/modal-library').open({ name });
      dispatch('divi/app-ui').setElementProperty({
        elementName:   'sidebarLeft',
        propertyGroup: 'dimension',
        propertyName:  'width',
        value:         500,
      });
    }
  };

  // Add custom button to BuilderBar.
  // Note: Using the same name as the modal so the button automatically becomes active when modal is open.
  registerBuilderBarButton({
    name,
    label:   'Dev Tool',
    iconSvg: { name: 'divi/setting' },
    order:   50,
    onClick: toggleDevTool,
  });

  dispatch('divi/modal-library').addModal({
    name,
    label:           __('D5 Dev Tool', 'et_builder'),
    type:            'multiInstanceModal',
    component:       Divi5DevTool as unknown as ReactNode,
    sidebarPosition: 'left',
  });

  forEach(contentPanelMap, ({ label, id, component }) => {
    const modalName             = `${name}--${id}`;
    const panelAsModalComponent = (() => createElement(PanelBasedModal, {
      children:  createElement(component as any, {}),
      modalName,
      label,
    })) as unknown as ReactNode;

    dispatch('divi/modal-library').addModal({
      name:      modalName,
      label:     sprintf(__('D5 Dev Tool: %s', 'et_builder'), label),
      type:      'multiInstanceModal',
      component: panelAsModalComponent,
    });
  });

  forEach(aiAgentsPanelMap, ({ label, id, component }) => {
    const modalName             = `${name}--${id}`;
    const panelAsModalComponent = (() => createElement(PanelBasedModal, {
      children:  createElement(component as any, {}),
      modalName,
      label,
    })) as unknown as ReactNode;

    dispatch('divi/modal-library').addModal({
      name:      modalName,
      label:     sprintf(__('D5 Dev Tool: %s', 'et_builder'), label),
      type:      'multiInstanceModal',
      component: panelAsModalComponent,
    });
  });

  forEach(toolsPanelMap, ({ label, id, component }) => {
    const modalName             = `${name}--${id}`;
    const panelAsModalComponent = (() => createElement(PanelBasedModal, {
      children:  createElement(component as any, {}),
      modalName,
      label,
    })) as unknown as ReactNode;

    dispatch('divi/modal-library').addModal({
      name:      modalName,
      label:     sprintf(__('D5 Dev Tool: %s', 'et_builder'), label),
      type:      'multiInstanceModal',
      component: panelAsModalComponent,
    });
  });
};

// Third-party scripts load after visual-builder, so register immediately if stores are ready.
if (didAction('divi.visualBuilder.registerStores.after')) {
  registerDevTool();
} else {
  addAction('divi.visualBuilder.registerStores.after', 'divi5DevTool', registerDevTool);
}
