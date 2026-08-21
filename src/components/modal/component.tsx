// External dependencies.
import React from 'react';

// WordPress dependencies
import { __ } from '@wordpress/i18n';

// Internal dependencies.
import {
  WrapperContainer,
  Header,
  BodyPanelWrapperContainer,
  PanelContainer,
} from '@divi/modal';
import { ErrorBoundary } from '@divi/error-boundary';

// Local dependencies.
import { ContentPanel } from '../content-panel';
import { ContentPanelWrapper } from '../content-panel-wrapper';
import { contentPanelMap } from '../content-panel-map';
import { aiAgentsPanelMap } from '../content-ai-agents-panel-map';
import { Divi5DevToolProps } from './types';
import './styles.scss';

/**
 * Divi 5 Dev Tool modal component.
 */
const Divi5DevTool = ({
  name,
  tab
}: Divi5DevToolProps) => {
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
          <PanelContainer id="ai-agents" label={__('AI Agents', 'et_builder')}>
            <div className="d5-dev-tool-ai-agents-panel">
              <ContentPanelWrapper>
                {aiAgentsPanelMap.map(({ id, label, component: Component }) => (
                  <ContentPanel key={id} id={id} label={label}>
                    <Component />
                  </ContentPanel>
                ))}
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
