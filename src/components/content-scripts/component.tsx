// External dependencies.
import React, { ReactElement} from 'react';
import {
  forEach,
} from 'lodash';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import { ContentScriptsProps } from './types';


/**
 * Component for displaying registered frontend scripts
 */
export const ContentScripts = ({
  scripts,
}: ContentScriptsProps) => {
  const scriptList: ReactElement[] = [];

  forEach(scripts, (scriptItems, scriptName) => {
    const scriptItem = (
      <div key={`state-monitor-script-${scriptName}`} className="et-vb-dev-state-monitor-script">
        <h2 className="et-vb-dev-state-monitor-script-heading">{scriptName}</h2>
        <ObjectRenderer values={scriptItems} />
      </div>
    );

    scriptList.push(scriptItem);
  });

  return (
    <div>{scriptList}</div>
  );
}