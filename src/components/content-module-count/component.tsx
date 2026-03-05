// External dependencies.
import React, { ReactElement } from 'react';

// Divi dependencies
import {
  useSelect,
} from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

/**
 * Component for displaying module count information
 */
export const ContentModuleCount = (): ReactElement => {
  const moduleCount = useSelect(selectStore => {
    // Get module count using the selector
    return selectStore('divi/module').getModuleCount();
  }, []);

  console.log({
    moduleCount,
  });

  return (
    <div>
      <h3>Module Count</h3>
      <ObjectRenderer values={{ moduleCount }} />
    </div>
  );
};