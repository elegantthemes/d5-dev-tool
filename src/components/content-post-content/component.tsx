// External dependencies.
import React, {
  ReactElement,
  useEffect,
  useState,
} from 'react';
import {
  get,
  map,
} from 'lodash';

// Divi dependencies.
import {
  useSelect,
} from '@divi/data';

// Local dependencies.
import { ModuleTreeView } from '../module-tree-view';

const defaultModalName = 'divi/divi-5-dev-tool';

interface ContentPostContentProps {
  modalName?: string;
}

/**
 * Component for displaying post content modules tree.
 */
export const ContentPostContent = ({
  modalName = defaultModalName,
}: ContentPostContentProps): ReactElement => {
  const {
    activeModalSetting,
    draggedModules,
    hoveredModule,
    lastModuleClipboard,
    modules,
    rightClickedModuleId,
    selectedModules,
  } = useSelect((selectStore: any) => {
    const editPostStoreSelectors = selectStore('divi/edit-post');
    const eventsStoreSelectors = selectStore('divi/events');
    const rightClickOptionsSelectors = selectStore('divi/right-click-options');
    const modalSelectors = selectStore('divi/modal-library');

    const singleModalState = modalSelectors.getActiveModal('single');
    const rightClick = rightClickOptionsSelectors.getState();
    const getModuleIds = (moduleItems: any[] = []) => map(moduleItems, module => module?.id);

    return {
      activeModalSetting: 'divi/module' === singleModalState?.name && singleModalState?.owner,
      draggedModules: getModuleIds(eventsStoreSelectors.getDraggedModules().asMutable()),
      hoveredModule: eventsStoreSelectors.getHoveredModule(),

      // @todo (D5) to be updated once new selector has been made.
      lastModuleClipboard: {},
      modules: editPostStoreSelectors.getContent(),
      rightClickedModuleId: rightClick.active ? get(rightClick, ['owner', 'id']) : '',
      selectedModules: getModuleIds(eventsStoreSelectors.getSelectedModules(false)),
    };
  }, [modalName]);

  const [localExpandedModuleIds, setLocalExpandedModuleIds] = useState<string[]>([]);

  useEffect(() => {
    setLocalExpandedModuleIds([]);
  }, [modalName]);

  return (
    <ModuleTreeView
      activeModalSetting={activeModalSetting}
      draggedModules={draggedModules}
      expandedModuleIds={localExpandedModuleIds}
      hoveredModule={hoveredModule}
      lastModuleClipboard={lastModuleClipboard as any}
      modules={modules}
      root={modules.root}
      rightClickedModuleId={rightClickedModuleId}
      selectedModules={selectedModules}
      setExpandedModuleIds={(moduleIds: string[]) => {
        setLocalExpandedModuleIds(moduleIds);
      }}
    />
  );
};
