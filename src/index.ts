import jQuery from 'jquery';

// Divi dependencies
import { dispatch } from '@divi/data';

// Local dependencies
import {
  Divi5DevTool,
  name,
} from './components/modal';
import { ReactNode } from 'react';

declare global {
  interface Window {
    jQuery: typeof jQuery;
  }
}

// Ensure that the following function is registered on app window.
// @todo this top / window detection should be abstracted into util function.
if (window.top !== window) {

  // Toggle function for the dev tool
  const toggleDevTool = () => {
    // Check current modal state using the selector
    const isDevToolOpen = (window.divi as any).data.select('divi/modal-library').isModalActive(name);

    if (isDevToolOpen) {
      // Close the modal
      dispatch('divi/modal-library').close({ name });
    } else {
      // Open the modal
      dispatch('divi/modal-library').open({ name });
      dispatch('divi/app-ui').setElementProperty({
        elementName:   'sidebarLeft',
        propertyGroup: 'dimension',
        propertyName:  'width',
        value: 500
      });
    }
  };

  // Listen to click event on top window's admin bar item (keep existing functionality).
  window.top.jQuery('#wp-admin-bar-divi-5-dev-tool > a').on('click', (event: JQuery.Event) => {
    event.preventDefault();
    toggleDevTool();
  });

  // Add custom button to BuilderBar
  // Note: Using the same name as the modal so the button automatically becomes active when modal is open
  (dispatch('divi/app-ui') as any).addBuilderBarButton({
    name: name, // Use the same name as the modal for automatic active state
    label: 'Dev Tool',
    iconSvg: { name: 'divi/setting' },
    order: 50, // Place it after other built-in buttons
    onClick: toggleDevTool,
    hasSeparator: true,
  });

  // On script load, register `divi/divi-5-dev-tool` modal to modals registry.
  dispatch('divi/modal-library').addModal({
    name,
    type:            'multiInstanceModal',
    component:       Divi5DevTool as unknown as ReactNode,
    sidebarPosition: 'left',

  });

}
