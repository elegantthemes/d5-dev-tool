// External depdencies.
import React from 'react';
import classnames from 'classnames';
import { map } from 'lodash';

// Local dependencies.
import { ContentKeyboardProps } from './types';

/**
 * Component for rendering keyboard content.
 */
export const ContentKeyboard = ({
  currentShortcut,
  pressedKeys
}: ContentKeyboardProps) => (
  <div
    className={classnames({
      'et-devtool-state-monitor-overview': true,
    })}
  >
    <div className="et-devtool-state-monitor-overview-keypress">
      <h3>Keypress</h3>
      <div className="et-devtool-state-monitor-overview-value">
        {map(pressedKeys, key => (
          <kbd key={`et-devtool-state-monitor-overview-key-${key}`}>{key}</kbd>
        ))}
      </div>
    </div>
    <div className="et-devtool-state-monitor-overview-shortcut">
      <h3>Shortcuts</h3>
      <div className="et-devtool-state-monitor-overview-value">
        <pre>
          {currentShortcut?.name}
        </pre>
      </div>
    </div>
  </div>
);