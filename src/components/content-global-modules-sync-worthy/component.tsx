// External dependencies.
import React, { ReactElement } from 'react';

// WordPress dependencies.
import { __, sprintf } from '@wordpress/i18n';

// Divi dependencies.
import { select, useSelect } from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

/**
 * Component for displaying Global Modules' Sync Worthy Changes.
 */
export const ContentGlobalModulesSyncWorthy = (): ReactElement => {
  const {
    syncWorthyChanges,
  } = useSelect((selectStore: typeof select) => ({
    syncWorthyChanges: selectStore('divi/global-layouts').getSyncWorthyChanges(),
  }));

  return (
    <div className="d5-dev-tool-global-modules-sync-worthy">
      <h4>{__('Global Modules', 'divi-5-dev-tool')}</h4>
      <h2>{__('Sync Worthy Changes', 'divi-5-dev-tool')}</h2>
      {syncWorthyChanges.length > 0 ? (
        syncWorthyChanges.map((item, idx) => (
          <div
            key={idx}
            className="d5-dev-tool-global-modules-sync-worthy-item"
          >
            <h4>{sprintf(__('Type: %s', 'divi-5-dev-tool'), item?.action?.type)}</h4>
            <ObjectRenderer
              values={item}
              initialExpand={false}
            />
          </div>
        ))
      ) : (
        <div className="d5-dev-tool-no-items">
          {__('No global modules sync worthy changes found', 'divi-5-dev-tool')}
        </div>
      )}
    </div>
  );
}