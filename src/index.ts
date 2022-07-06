// Divi dependencies
import { dispatch } from '@divi/data';

// Local dependencies
import {
  DevStateMonitorContainer,
  name,
  type
} from './components/modal';

// Open divi/dev-state-monitor, a registered modal, when state-monitor menu item on admin bar is clicked.
// This ensure that the following function is registered on app window.
// @todo this top / window detection should be abstracted into util function.
if (window.top !== window) {

  // Listen to click event on top window's admin bar item. The condition above ensures that the
  // following is only executed in app window.
  window.top.jQuery('#wp-admin-bar-d5-modal-dev-state-monitor a').on('click', (event: JQuery.Event) => {
    event.preventDefault();

    // Open registered modal, divi/dev-clipboard.
    dispatch('divi/modal-library').open({ name });
  });

  // On script load, register `divi/clipboard` modal to modals registry.
  dispatch('divi/modal-library').addModal({
    name,
    type,
    component: DevStateMonitorContainer,
  });
}
