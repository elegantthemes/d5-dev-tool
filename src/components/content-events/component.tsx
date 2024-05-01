// External dependencies.
import React, {
  useState,
} from 'react';
import classnames from 'classnames';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

/**
 * Component for rendering events.
 */
export const ContentEvents = ({
  draggedModules,
  hoveredModule,
  selectedModules,
}) => {
  const [draggedState, setDraggedState]               = useState(false);
  const [hoveredState, setHoveredState]               = useState(false);
  const [selectedState, setSelectedState]             = useState(false);

  return (
    <div
      className={classnames({
        'd5-dev-tool-overview': true,
      })}
    >
      <h3>Dragged Modules</h3>
      <button
        onClick={() => setDraggedState(!draggedState)}
      >{draggedState ? 'Collapse' : 'Expand'}</button>
      {draggedState && (
        <ObjectRenderer values={draggedModules} />
      )}

      <h3 style={{ marginTop: 35 }}>Hovered Module</h3>
      <button
        onClick={() => setHoveredState(!hoveredState)}
      >{hoveredState ? 'Collapse' : 'Expand'}</button>
      {hoveredState && (
        <ObjectRenderer values={hoveredModule} />
      )}

      <h3 style={{marginTop: 35}}>Selected Modules</h3>
      <button
        onClick={() => setSelectedState(!selectedState)}
      >
        {selectedState ? 'Collapse' : 'Expand'}
      </button>
      {selectedState && (
        <ObjectRenderer values={selectedModules} />
      )}
    </div>
  )
}