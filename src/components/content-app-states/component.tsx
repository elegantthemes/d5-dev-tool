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
      'et-devtool-state-monitor-overview': true,
    })}
  >
    <div className="et-devtool-state-monitor-overview-view">
      <h3>View</h3>
      <div className="et-devtool-state-monitor-overview-value">
        {view}
      </div>
    </div>
    <div className="et-devtool-state-monitor-overview-breakpoint">
      <h3>Breakpoint</h3>
      <div className="et-devtool-state-monitor-overview-value">
        {breakpoint}
      </div>
    </div>
    <div className="et-devtool-state-monitor-overview-attribute-state">
      <h3>Attribute State</h3>
      <div className="et-devtool-state-monitor-overview-value">
        {attributeState}
      </div>
    </div>

    <div className="et-devtool-state-monitor-overview-selected">
      <h3>Selected</h3>
      <div className="et-devtool-state-monitor-overview-value">
        {selectedModules.length}
        {selectedModules.length > 1 ? ' Modules' : ' Module'}
      </div>
    </div>
  </div>
)