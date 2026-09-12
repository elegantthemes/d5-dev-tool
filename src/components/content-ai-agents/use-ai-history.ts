// External dependencies.
import {
  useEffect,
  useState,
} from 'react';

// Local dependencies.
import {
  clearHistory,
  getActiveRunId,
  getEntry,
  listEntries,
  loadHistory,
  setActiveRunId,
  subscribeToHistory,
  updateEntryDescription,
  type HistoryEntry,
} from './utils/history-store';

export type AiHistorySnapshot = {
  entries: HistoryEntry[];
  activeRunId: string | null;
  activeEntry: HistoryEntry | null;
};

/**
 * Reactive snapshot of persisted AI payload history and the selected run.
 */
export const useAiHistory = (): AiHistorySnapshot & {
  setActiveRunId: typeof setActiveRunId;
  clearHistory: typeof clearHistory;
  updateEntryDescription: typeof updateEntryDescription;
} => {
  const [snapshot, setSnapshot] = useState<AiHistorySnapshot>(() => {
    loadHistory();

    const entries = listEntries();
    const activeRunId = getActiveRunId();

    return {
      entries,
      activeRunId,
      activeEntry: getEntry(activeRunId) ?? entries[0] ?? null,
    };
  });

  useEffect(() => {
    const syncSnapshot = () => {
      const entries = listEntries();
      const activeRunId = getActiveRunId();

      setSnapshot({
        entries,
        activeRunId,
        activeEntry: getEntry(activeRunId) ?? entries[0] ?? null,
      });
    };

    syncSnapshot();

    return subscribeToHistory(syncSnapshot);
  }, []);

  return {
    ...snapshot,
    setActiveRunId,
    clearHistory,
    updateEntryDescription,
  };
};
