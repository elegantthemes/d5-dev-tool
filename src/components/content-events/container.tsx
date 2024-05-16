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
    draggedModuleDropZone,
    hoveredModule,
    selectedModules,
  } = useSelect(selectStore => ({
    draggedModules:  selectStore('divi/events').getDraggedModules(),
    draggedModuleDropZone: selectStore('divi/events').getDraggedModuleDropZone(),
    hoveredModule:   selectStore('divi/events').getHoveredModule('current'),
    selectedModules: selectStore('divi/events').getSelectedModules(),
  }));

  return (
    <ContentEvents
      draggedModules={draggedModules}
      draggedModuleDropZone={draggedModuleDropZone}
      hoveredModule={hoveredModule}
      selectedModules={selectedModules}
    />
  );
}