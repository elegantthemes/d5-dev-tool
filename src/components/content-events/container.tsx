// External dependencies.
import React from 'react';

// Divi dependencies.
import {
  select,
  useSelect,
} from '@divi/data';

// Local dependencies.
import {
  ContentEvents
} from './component';

/**
 * Container for events content.
 */
export const ContentEventsContainer = () => {
  const {
    draggedModules,
    hoveredModule,
    selectedModules,
  } = useSelect(selectStore => ({
    draggedModules:  selectStore('divi/events').getDraggedModules(),
    hoveredModule:   selectStore('divi/events').getHoveredModule('current'),
    selectedModules: selectStore('divi/events').getSelectedModules(),
  }));

  return (
    <ContentEvents
      draggedModules={draggedModules}
      hoveredModule={hoveredModule}
      selectedModules={selectedModules}
    />
  );
}