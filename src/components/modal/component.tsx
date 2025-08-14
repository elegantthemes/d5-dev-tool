// External dependencies.
import React, { ReactElement } from 'react';
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
import { ContentLayoutContainer } from '../content-layout';
import { ContentSavedContainer } from '../content-saved'
import { ContentScriptsContainer } from '../content-scripts';
import { ContentAppStatesContainer } from '../content-app-states';
import { ContentKeyboardContainer } from '../content-keyboard';
import { ContentGlobalContainer } from '../content-global';
import { ContentClipboardContainer } from '../content-clipboard';
import { ContentEventsContainer } from '../content-events'
import { ContentDiviOptionsContainer } from '../content-divi-options';
import { ContentPresetsContainer } from '../content-presets';
import { ReferencesTreeView } from '../references-tree-view';
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
                <ContentPanel id="layout" label={__('Layout', 'et_builder')}>
                  <ContentLayoutContainer />
                </ContentPanel>
                <ContentPanel id="saved" label={__('Saved Content', 'et_builder')}>
                  <ContentSavedContainer />
                </ContentPanel>
                <ContentPanel id="scripts" label={__('Scripts', 'et_builder')}>
                  <ContentScriptsContainer />
                </ContentPanel>
                <ContentPanel id="global" label={__('Global', 'et_builder')}>
                  <ContentGlobalContainer />
                </ContentPanel>
                <ContentPanel id="app-state" label={__('App State', 'et_builder')}>
                  <ContentAppStatesContainer />
                </ContentPanel>
                <ContentPanel id="events" label={__('Events', 'et_builder')}>
                  <ContentEventsContainer />
                </ContentPanel>
                <ContentPanel id="keyboard" label={__('Keyboard', 'et_builder')}>
                  <ContentKeyboardContainer />
                </ContentPanel>
                <ContentPanel id="clipboard" label={__('Clipboard', 'et_builder')}>
                  <ContentClipboardContainer />
                </ContentPanel>
                <ContentPanel id="divi-options" label={__('Divi Options', 'et_builder')}>
                  <ContentDiviOptionsContainer />
                </ContentPanel>
                <ContentPanel id="presets" label={__('Presets', 'et_builder')}>
                  <ContentPresetsContainer />
                </ContentPanel>
              </ContentPanelWrapper>
            </div>
          </PanelContainer>
          <PanelContainer id="tools" label={__('Tools', 'et_builder')}>
            <div style={{ padding: '20px' }}>
              <ContentPanelWrapper>
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
