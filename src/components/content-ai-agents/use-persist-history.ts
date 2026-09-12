// External dependencies.
import {
  useEffect,
  useRef,
} from 'react';

// Local dependencies.
import { useCurrentChatDebug } from './use-current-chat-debug';
import { useNetworkRecords } from './use-network-records';
import {
  buildHistoryEntry,
  mergeHistoryEntry,
} from './utils/build-history-entry';
import {
  filterInferenceRecords,
  filterInferenceRecordsForTurn,
} from './utils/filter-inference-records';
import {
  getEntry,
  setActiveRunId,
  upsertEntry,
} from './utils/history-store';

const isPersistableTurnKey = (turnKey: string): boolean => (
  Boolean(turnKey) && !turnKey.endsWith(':no-turn') && !turnKey.startsWith('run-0')
);

/**
 * Captures settled inference requests for the current chat turn into localStorage.
 *
 * Mount once at the AI Agents panel so history is recorded regardless of the
 * active tab. Incomplete SSE requests are ignored until `endedAt` is set.
 */
export const usePersistHistory = (): void => {
  const { records } = useNetworkRecords();
  const chatDebug = useCurrentChatDebug();
  const previousTurnKeyRef = useRef('');

  const turnKey = chatDebug?.turnKey ?? '';
  const promptText = chatDebug?.promptText ?? '';
  const chatId = chatDebug?.currentChatId ?? '';
  const turnWindow = chatDebug?.turnWindow ?? {
    startedAt: null,
    endedAt: null,
  };

  useEffect(() => {
    if (!isPersistableTurnKey(turnKey)) {
      return;
    }

    if (turnKey !== previousTurnKeyRef.current) {
      previousTurnKeyRef.current = turnKey;
      setActiveRunId(turnKey);
    }

    const settledRecords = filterInferenceRecordsForTurn(
      filterInferenceRecords(records),
      turnWindow.startedAt,
      turnWindow.endedAt,
    ).filter(record => null !== record.endedAt);

    if (0 === settledRecords.length) {
      return;
    }

    const incoming = buildHistoryEntry({
      id: turnKey,
      chatId,
      promptText,
      records: settledRecords,
    });

    upsertEntry(mergeHistoryEntry(getEntry(turnKey), incoming));
  }, [chatId, promptText, records, turnKey, turnWindow.endedAt, turnWindow.startedAt]);
};
