// External dependencies.
import React, { ReactElement} from 'react';
import {
  forEach,
} from 'lodash';

// WordPress dependencies.
import {
  sprintf,
  __,
} from '@wordpress/i18n';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import { ContentScriptsProps } from './types';
import './styles.scss';


/**
 * Component for displaying registered frontend scripts
 */
export const ContentScripts = ({
  scripts,
}: ContentScriptsProps) => {
  const scriptList: ReactElement[] = [];

  forEach(scripts, (scriptItems, scriptName) => {
    const scriptItem = (
      <div key={`dev-tool-script-${scriptName}`} className="d5-dev-tool-script">
        <h2 className="d5-dev-tool-script-heading">{scriptName}</h2>
        {Object.keys(scriptItems)?.length
          ? (
            <ObjectRenderer values={scriptItems} />
          )
          : (
            <div className="d5-dev-tool-no-items">
              {sprintf(__('No %s found', 'divi-5-dev-tool'), scriptName)}
            </div>
          )
        }

      </div>
    );

    scriptList.push(scriptItem);
  });

  return (
    <div>{scriptList}</div>
  );
}