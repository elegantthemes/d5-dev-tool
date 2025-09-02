// External dependencies.
import React, { ReactNode } from 'react';

// WordPress dependencies
import {
  __ ,
  sprintf
} from '@wordpress/i18n';

// Internal dependencies.
import {
  WrapperContainer,
  Header,
  BodyContainer,
  PanelContainer,
} from '@divi/modal';
import { ErrorBoundary } from '@divi/error-boundary';


/**
 * Panel-based modal component.
 * Modal component for rendering panel as modal.
 */
export const PanelBasedModal = ({
  modalName,
  label,
  children,
}: {
  modalName: string;
  label: string;
  children: ReactNode;
}) => {
  return (
    <ErrorBoundary
      key={modalName}
      componentName={modalName}
    >
      <WrapperContainer
        draggable
        resizable
        expandable
        snappable
        modalName={modalName}
        multiPanels={false}
      >
        <Header
          name={sprintf(__('D5 Dev Tool: %s', 'et_builder'), label)}
        />
        <BodyContainer>
          <PanelContainer id={modalName} opened>
            <div style={{
              padding: '20px 20px 40px 20px',
            }}
            >
              {children}
            </div>
          </PanelContainer>
        </BodyContainer>
      </WrapperContainer>
    </ErrorBoundary>
  );
};