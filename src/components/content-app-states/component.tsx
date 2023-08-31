// External dependencies.
import React from 'react';
import classnames from 'classnames';

// Local dependencies.
import { ContentAppStatesProps } from './types';

/**
 * Component for rendering app states.
 */
export const ContentAppStates = ({
  view,
  breakpoint,
  attributeState,
  selectedModules,
}: ContentAppStatesProps) => (
  <div
    className={classnames({
      'd5-dev-tool-overview': true,
    })}
  >
    <div className="d5-dev-tool-overview-view">
      <h3>View</h3>
      <div className="d5-dev-tool-overview-value">
        {view}
      </div>
    </div>
    <div className="d5-dev-tool-overview-breakpoint">
      <h3>Breakpoint</h3>
      <div className="d5-dev-tool-overview-value">
        {breakpoint}
      </div>
    </div>
    <div className="d5-dev-tool-overview-attribute-state">
      <h3>Attribute State</h3>
      <div className="d5-dev-tool-overview-value">
        {attributeState}
      </div>
    </div>

    <div className="d5-dev-tool-overview-selected">
      <h3>Selected</h3>
      <div className="d5-dev-tool-overview-value">
        {selectedModules.length}
        {selectedModules.length > 1 ? ' Modules' : ' Module'}
      </div>
    </div>
  </div>
)