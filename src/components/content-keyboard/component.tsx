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
      'd5-dev-tool-overview': true,
    })}
  >
    <div className="d5-dev-tool-overview-keypress">
      <h3>Keypress</h3>
      <div className="d5-dev-tool-overview-value">
        {map(pressedKeys, key => (
          <kbd key={`d5-dev-tool-overview-key-${key}`}>{key}</kbd>
        ))}
      </div>
    </div>
    <div className="d5-dev-tool-overview-shortcut">
      <h3>Shortcuts</h3>
      <div className="d5-dev-tool-overview-value">
        <pre>
          {currentShortcut?.name}
        </pre>
      </div>
    </div>
  </div>
);