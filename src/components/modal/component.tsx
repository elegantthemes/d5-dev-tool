// External dependencies.
import React from 'react';
import {
  isEmpty,
  keys,
  reduce,
} from 'lodash';

// WordPress dependencies
import { __ } from '@wordpress/i18n';

// Internal dependencies.
import {
  WrapperContainer,
  Header,
  BodyPanelWrapperContainer,
  PanelContainer,
} from '@divi/modal';
import { generateModuleSettingsConfiguration } from '@divi/module-library';
import { ErrorBoundary } from '@divi/error-boundary';

// Local dependencies.
import { ContentPanel } from '../content-panel';
import { ContentPanelWrapper } from '../content-panel-wrapper';
import { ContentAddNewContainer } from '../content-add-new';
import { ReferencesTreeView } from '../references-tree-view';
import { contentPanelMap } from '../content-panel-map';
import { ToolGenerateModuleSettingsConfigurationContainer } from '../tool-generate-module-settings-configuration';
import { Divi5DevToolProps } from './types';
import './styles.scss';

/**
 * Divi 5 Dev Tool modal component.
 */
const Divi5DevTool = ({
  name,
  tab
}: Divi5DevToolProps) => {
  const diviModuleExports = reduce<Record<string, unknown>, Record<string, string[]>>(window?.divi, (result, value, category) => {
    if (!isEmpty(value)) {
      result[category] = keys(value);
    }
    return result;
  }, {});

  return (
    <ErrorBoundary
      key="et-vb-divi-modals--dev-tool"
      componentName="et-vb-divi-modals--dev-tool"
    >
      <WrapperContainer
        draggable
        resizable
        expandable
        snappable
        modalName={name}
        modalActiveTab={tab ? tab : 'states'}
        multiPanels={false}
      >
        <Header
          name={__('Divi 5 Dev Tool', 'et_builder')}
        />
        <BodyPanelWrapperContainer>
          <PanelContainer id="states" label={__('States', 'et_builder')}>
            <div style={{
              padding: '20px 20px 40px 20px',
            }}
            >
              <ContentPanelWrapper>
                {contentPanelMap.map(({ id, label, component: Component }) => (
                  <ContentPanel key={id} id={id} label={label}>
                    <Component />
                  </ContentPanel>
                ))}
              </ContentPanelWrapper>
            </div>
          </PanelContainer>
          <PanelContainer id="tools" label={__('Tools', 'et_builder')}>
            <div style={{ padding: '20px' }}>
              <ContentPanelWrapper>
                <ContentPanel id="add-new" label={__('Add New', 'et_builder')}>
                  <ContentAddNewContainer />
                </ContentPanel>
                <ContentPanel id="generate-module-settings-config" label={__('Generate Module Settings Configuration', 'et_builder')}>
                  {generateModuleSettingsConfiguration ? (
                    <ToolGenerateModuleSettingsConfigurationContainer />
                  ) : (
                    __('You need to use at least Divi 5 Dev Beta 4 for this tool to work')
                  )}
                </ContentPanel>
                <ContentPanel id="module-metadata" label={__('Module Metadata', 'et_builder')}>
                  Coming Soon
                </ContentPanel>
              </ContentPanelWrapper>
            </div>
          </PanelContainer>
          <PanelContainer id="references" label={__('References', 'et_builder')}>
            <div style={{ padding: '20px' }}>
              <ContentPanelWrapper>
                <ContentPanel id="packages" label={__('Packages', 'et_builder')}>
                  <ReferencesTreeView data={diviModuleExports} />
                </ContentPanel>
                <ContentPanel id="data-stores" label={__('Data Stores', 'et_builder')}>
                  Coming Soon
                </ContentPanel>
                <ContentPanel id="filters" label={__('Filters', 'et_builder')}>
                  Coming Soon
                </ContentPanel>
                <ContentPanel id="actions" label={__('Actions', 'et_builder')}>
                  Coming Soon
                </ContentPanel>
              </ContentPanelWrapper>
            </div>
          </PanelContainer>
        </BodyPanelWrapperContainer>
      </WrapperContainer>
    </ErrorBoundary>
  );
};

export {
  Divi5DevTool,
};
