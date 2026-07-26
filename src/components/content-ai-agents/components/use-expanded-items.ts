import {
  useCallback,
  useEffect,
  useState,
} from 'react';

const buildExpandedState = (
  itemIds: string[],
  previousState: Record<string, boolean>,
  defaultExpanded: boolean,
): Record<string, boolean> => {
  const nextState: Record<string, boolean> = {};

  itemIds.forEach(itemId => {
    nextState[itemId] = previousState[itemId] ?? defaultExpanded;
  });

  return nextState;
};

const hasSameExpandedState = (
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean => {
  const leftKeys = Object.keys(left);

  return leftKeys.length === Object.keys(right).length
    && leftKeys.every(itemId => left[itemId] === right[itemId]);
};

/**
 * Tracks expanded/collapsed state for a list of keyed items.
 */
export const useExpandedItems = (itemIds: string[], defaultExpanded = false) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const itemIdsKey = itemIds.join('\0');

  useEffect(() => {
    const nextItemIds = itemIdsKey ? itemIdsKey.split('\0') : [];

    setExpandedItems(previousState => {
      const nextState = buildExpandedState(nextItemIds, previousState, defaultExpanded);

      return hasSameExpandedState(previousState, nextState) ? previousState : nextState;
    });
  }, [defaultExpanded, itemIdsKey]);

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
