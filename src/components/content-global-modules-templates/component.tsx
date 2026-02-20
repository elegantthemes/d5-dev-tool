// External dependencies.
import React, { ReactElement } from 'react';
import { size } from 'lodash';

// WordPress dependencies.
import { __, sprintf } from '@wordpress/i18n';

// Divi dependencies.
import { select, useSelect } from '@divi/data';
import { ObjectRenderer } from '@divi/object-renderer';

import './styles.scss';

/**
 * Component for displaying Global Modules' Templates.
 */
export const ContentGlobalModulesTemplates = (): ReactElement => {
  const {
    globalModulesTemplates,
  } = useSelect((selectStore: typeof select) => ({
    globalModulesTemplates: 'getLayouts' in selectStore('divi/global-layouts') ? selectStore('divi/global-layouts')?.getLayouts() : {},
  }));

  return (
    <div className="d5-dev-tool-global-modules-templates">
      <h2 className="d5-dev-tool-panel-title">{__('Global Modules Templates', 'divi-5-dev-tool')}</h2>
      {size(globalModulesTemplates) > 0 ? (
        Object.entries(globalModulesTemplates)?.map((item, idx) => {
          const globalModuleId = item[0];
          const template = item[1];
          const templateContent    = template?.content;
          const templateModuleMap  = template?.modulesMap;
          const templateModuleName = templateContent?.[templateContent?.root?.children?.[0]]?.name;
          const instanceIds        = templateModuleMap?.map(mapInstance => {

            return mapInstance?.root?.children?.[0];
          });

          return (
            <div
              key={idx}
              className="d5-dev-tool-global-modules-template"
            >
              <div className="d5-dev-tool-global-modules-template-info">
                <dl>
                  <dt>{__('Global Module ID', 'divi-5-dev-tool')}</dt>
                  <dd>{globalModuleId}</dd>

                  <dt>{__('Module Name', 'divi-5-dev-tool')}</dt>
                  <dd>{templateModuleName}</dd>

                  <dt>{__('Instance IDs', 'divi-5-dev-tool')}</dt>
                  {instanceIds.map(instanceId => (
                    <dd key={`global-module-template-instance-id-${instanceId}`}>{instanceId}</dd>
                  ))}

                  <dt>{__('Has Synced To Server', 'divi-5-dev-tool')}</dt>
                  <dd>{template?.hasSavedSincePreEditCapture ? __('Yes', 'divi-5-dev-tool') : __('No', 'divi-5-dev-tool')}</dd>

                  <dt>{__('Confirmation Popup', 'divi-5-dev-tool')}</dt>
                  <dd>{template?.isConfirmationPopupOpen ? __('Opened', 'divi-5-dev-tool') : __('Closed', 'divi-5-dev-tool')}</dd>

                  <dt>{__('Confirmation Popup Type', 'divi-5-dev-tool')}</dt>
                  <dd>{template?.confirmationType}</dd>
                </dl>
              </div>

              <div className="d5-dev-tool-global-modules-template-object">
                <h5>{__('Template Content', 'divi-5-dev-tool')}</h5>
                <ObjectRenderer
                  values={templateContent}
                  initialExpand={false}
                />
              </div>

              <div className="d5-dev-tool-global-modules-template-object">
                <h5>{__('Template Module Map', 'divi-5-dev-tool')}</h5>
                <ObjectRenderer
                  values={templateModuleMap}
                  initialExpand={false}
                />
              </div>

              <div className="d5-dev-tool-global-modules-template-object">
                <h5>{__('Pre Edit Content', 'divi-5-dev-tool')}</h5>
                <ObjectRenderer
                  values={template?.preEditContent}
                  initialExpand={true}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="d5-dev-tool-global-modules-no-template">
          {__('No global modules template found', 'divi-5-dev-tool')}
        </div>
      )}
    </div>
  );
}