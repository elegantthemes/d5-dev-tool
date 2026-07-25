import {
  useCallback,
  useEffect,
  useState,
} from 'react';

/**
 * Tracks expanded/collapsed state for a list of keyed items.
 */
export const useExpandedItems = (itemIds: string[], defaultExpanded = false) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedItems(previousState => {
      const nextState: Record<string, boolean> = {};

      itemIds.forEach(itemId => {
        nextState[itemId] = previousState[itemId] ?? defaultExpanded;
      });

      return nextState;
    });
  }, [defaultExpanded, itemIds]);

  const isExpanded = useCallback(
    (itemId: string) => expandedItems[itemId] ?? defaultExpanded,
    [defaultExpanded, expandedItems],
  );

  const toggle = useCallback((itemId: string) => {
    setExpandedItems(previousState => ({
      ...previousState,
      [itemId]: !(previousState[itemId] ?? defaultExpanded),
    }));
  }, [defaultExpanded]);

  const expandAll = useCallback(() => {
    setExpandedItems(Object.fromEntries(itemIds.map(itemId => [itemId, true])));
  }, [itemIds]);

  const collapseAll = useCallback(() => {
    setExpandedItems(Object.fromEntries(itemIds.map(itemId => [itemId, false])));
  }, [itemIds]);

  return {
    isExpanded,
    toggle,
    expandAll,
    collapseAll,
  };
};
