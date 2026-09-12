// Local dependencies.
import { type InferenceCaller } from './extract-inference-metadata';
import { type PayloadSegment } from './segment-payload';

export const HISTORY_STORAGE_KEY = 'd5-dev-tool:ai-history:v1';
export const HISTORY_SCHEMA_VERSION = 1 as const;
export const HISTORY_MAX_ENTRIES = 50;
export const HISTORY_BYTE_BUDGET = 4 * 1024 * 1024;

export type CapturedRequest = {
  id: string;
  ordinal: number;
  startedAt: number;
  durationMs: number | null;
  caller: InferenceCaller;
  model: string;
  segments: PayloadSegment[];
  responseBody: string | null;
  payloadTokens: number;
  responseTokens: number;
};

export type HistoryEntry = {
  id: string;
  chatId: string;
  promptText: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  requestCount: number;
  totalTokens: number;
  requests: CapturedRequest[];
  schemaVersion: typeof HISTORY_SCHEMA_VERSION;
};

export type HistoryStoreSnapshot = {
  schemaVersion: typeof HISTORY_SCHEMA_VERSION;
  entries: HistoryEntry[];
};

export type HistoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type HistoryStoreState = {
  entries: HistoryEntry[];
  activeRunId: string | null;
  listeners: Array<() => void>;
};

const memoryData: Record<string, string> = {};

const memoryStorage: HistoryStorage = {
  getItem: (key: string): string | null => memoryData[key] ?? null,
  setItem: (key: string, value: string): void => {
    memoryData[key] = value;
  },
  removeItem: (key: string): void => {
    delete memoryData[key];
  },
};

let injectedStorage: HistoryStorage | null = null;

const state: HistoryStoreState = {
  entries: [],
  activeRunId: null,
  listeners: [],
};

let hasHydrated = false;

const notifyListeners = (): void => {
  state.listeners.slice().forEach(listener => {
    try {
      listener();
    } catch {
      // A failing debug listener must never break persistence.
    }
  });
};

const getBrowserStorage = (): HistoryStorage | null => {
  try {
    if ('undefined' !== typeof window && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Safari private mode and blocked storage throw on access.
  }

  return null;
};

const getStorage = (): HistoryStorage => injectedStorage ?? getBrowserStorage() ?? memoryStorage;

const isQuotaError = (error: unknown): boolean => {
  if (!error || 'object' !== typeof error) {
    return false;
  }

  const name = (error as { name?: string }).name;

  return 'QuotaExceededError' === name || 'NS_ERROR_DOM_QUOTA_REACHED' === name;
};

const estimateBytes = (value: string): number => {
  if ('undefined' !== typeof Blob) {
    return new Blob([value]).size;
  }

  return unescape(encodeURIComponent(value)).length;
};

const serializeSnapshot = (entries: HistoryEntry[]): string => JSON.stringify({
  schemaVersion: HISTORY_SCHEMA_VERSION,
  entries,
} satisfies HistoryStoreSnapshot);

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!value || 'object' !== typeof value) {
    return false;
  }

  const entry = value as Partial<HistoryEntry>;

  return 'string' === typeof entry.id
    && Array.isArray(entry.requests)
    && HISTORY_SCHEMA_VERSION === entry.schemaVersion;
};

const parseSnapshot = (raw: string | null): HistoryEntry[] => {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HistoryStoreSnapshot>;

    if (HISTORY_SCHEMA_VERSION !== parsed.schemaVersion || !Array.isArray(parsed.entries)) {
      return [];
    }

    return parsed.entries.filter(isHistoryEntry);
  } catch {
    return [];
  }
};

const evictByCount = (entries: HistoryEntry[]): HistoryEntry[] => {
  if (HISTORY_MAX_ENTRIES >= entries.length) {
    return entries;
  }

  return entries.slice(0, HISTORY_MAX_ENTRIES);
};

const RESPONSE_BODY_LIMIT = 4000;

const compactEntryForStorage = (entry: HistoryEntry): HistoryEntry => {
  const seenHashes = new Set<string>();

  return {
    ...entry,
    requests: entry.requests.map(request => ({
      ...request,
      responseBody: request.responseBody && RESPONSE_BODY_LIMIT < request.responseBody.length
        ? `${request.responseBody.slice(0, RESPONSE_BODY_LIMIT)}\n…[truncated ${request.responseBody.length} chars]`
        : request.responseBody,
      segments: request.segments.map(segment => {
        if (seenHashes.has(segment.hash)) {
          return {
            ...segment,
            text: '',
          };
        }

        seenHashes.add(segment.hash);

        return segment;
      }),
    })),
  };
};

const restoreEntryTexts = (entry: HistoryEntry): HistoryEntry => {
  const texts = new Map<string, string>();

  entry.requests.forEach(request => {
    request.segments.forEach(segment => {
      if (segment.text) {
        texts.set(segment.hash, segment.text);
      }
    });
  });

  return {
    ...entry,
    requests: entry.requests.map(request => ({
      ...request,
      segments: request.segments.map(segment => {
        if (segment.text) {
          return segment;
        }

        const text = texts.get(segment.hash);

        if (!text) {
          return segment;
        }

        return {
          ...segment,
          text,
        };
      }),
    })),
  };
};

const evictByBytes = (entries: HistoryEntry[]): HistoryEntry[] => {
  let next = entries;

  while (1 < next.length && HISTORY_BYTE_BUDGET < estimateBytes(serializeSnapshot(next))) {
    next = next.slice(0, -1);
  }

  return next;
};

const stripResponseBodies = (entries: HistoryEntry[]): HistoryEntry[] => (
  entries.map(entry => ({
    ...entry,
    requests: entry.requests.map(request => ({
      ...request,
      responseBody: null,
    })),
  }))
);

const stripSegmentTexts = (entries: HistoryEntry[]): HistoryEntry[] => (
  entries.map(entry => ({
    ...entry,
    requests: entry.requests.map(request => ({
      ...request,
      segments: request.segments.map(segment => ({
        ...segment,
        text: '',
      })),
    })),
  }))
);

/**
 * Best-effort localStorage write. Never writes an empty snapshot: a 20-request
 * layout run can exceed the origin quota once later payloads hit ~100k tokens.
 */
const persistToStorage = (entries: HistoryEntry[]): void => {
  const storage = getStorage();
  const write = (candidate: HistoryEntry[]): boolean => {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, serializeSnapshot(candidate));

      return true;
    } catch (error) {
      if (!isQuotaError(error)) {
        return true;
      }
    }

    return false;
  };

  let next = evictByBytes(evictByCount(entries).map(compactEntryForStorage));

  if (write(next)) {
    return;
  }

  while (1 < next.length) {
    next = next.slice(0, -1);

    if (write(next)) {
      return;
    }
  }

  const stripped = stripResponseBodies(next);

  if (write(stripped)) {
    return;
  }

  if (write(stripSegmentTexts(stripped))) {
    return;
  }
};

const hydrate = (): void => {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;
  state.entries = parseSnapshot(getStorage().getItem(HISTORY_STORAGE_KEY)).map(restoreEntryTexts);
};

const setEntries = (entries: HistoryEntry[]): void => {
  hydrate();
  const next = evictByCount(entries);
  persistToStorage(next);
  state.entries = next;
  notifyListeners();
};

const entriesAreEqual = (left: HistoryEntry, right: HistoryEntry): boolean => (
  left.id === right.id
  && left.chatId === right.chatId
  && left.promptText === right.promptText
  && (left.description ?? '') === (right.description ?? '')
  && left.model === right.model
  && left.requestCount === right.requestCount
  && left.totalTokens === right.totalTokens
  && left.requests.length === right.requests.length
  && left.requests.every((request, index) => {
    const other = right.requests[index];

    return other
      && request.id === other.id
      && request.ordinal === other.ordinal
      && request.payloadTokens === other.payloadTokens
      && request.responseTokens === other.responseTokens
      && request.responseBody === other.responseBody
      && request.segments.length === other.segments.length
      && request.segments.every((segment, segmentIndex) => (
        segment.hash === other.segments[segmentIndex]?.hash
      ));
  })
);

/**
 * Injects a storage backend. Used by unit tests; production reads localStorage.
 */
export const configureHistoryStorage = (storage: HistoryStorage | null): void => {
  injectedStorage = storage;
};

/**
 * Resets in-memory state without touching storage. Used by unit tests.
 */
export const resetHistoryStoreForTests = (): void => {
  hasHydrated = false;
  state.entries = [];
  state.activeRunId = null;
  Object.keys(memoryData).forEach(key => {
    delete memoryData[key];
  });
};

/**
 * Loads persisted history into memory. Safe to call more than once.
 */
export const loadHistory = (): HistoryEntry[] => {
  hydrate();

  return state.entries;
};

/**
 * Writes the current in-memory entries to storage.
 */
export const saveHistory = (): void => {
  hydrate();
  persistToStorage(state.entries);
};

/**
 * Inserts or replaces a run. Newest entries stay at the front.
 */
export const upsertEntry = (entry: HistoryEntry): void => {
  hydrate();

  const existingIndex = state.entries.findIndex(candidate => candidate.id === entry.id);
  const existing = -1 === existingIndex ? null : state.entries[existingIndex];
  const merged: HistoryEntry = null === existing
    ? entry
    : {
      ...entry,
      createdAt: existing.createdAt,
      description: 'string' === typeof entry.description
        ? entry.description
        : existing.description,
    };

  if (-1 !== existingIndex && entriesAreEqual(state.entries[existingIndex], merged)) {
    return;
  }

  const withoutExisting = -1 === existingIndex
    ? state.entries
    : state.entries.filter((_, index) => index !== existingIndex);

  setEntries([merged, ...withoutExisting]);
};

/**
 * Returns saved runs, newest first.
 */
export const listEntries = (): HistoryEntry[] => {
  hydrate();

  return state.entries;
};

/**
 * Returns one saved run, or null when it has been evicted.
 */
export const getEntry = (id: string | null | undefined): HistoryEntry | null => {
  if (!id) {
    return null;
  }

  hydrate();

  return state.entries.find(entry => entry.id === id) ?? null;
};

/**
 * Wipes persisted and in-memory history.
 */
export const clearHistory = (): void => {
  hydrate();
  state.entries = [];
  state.activeRunId = null;

  try {
    getStorage().removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage failures; memory is already empty.
  }

  notifyListeners();
};

/**
 * Saves a short note on a run so it is easy to find in the history picker.
 */
export const updateEntryDescription = (id: string, description: string): void => {
  const existing = getEntry(id);

  if (!existing) {
    return;
  }

  upsertEntry({
    ...existing,
    description: description.trim(),
    updatedAt: Date.now(),
  });
};

/**
 * Currently selected run id. Memory-only; not persisted.
 */
export const getActiveRunId = (): string | null => state.activeRunId;

/**
 * Pins the run shown by the evolution tab and history selector.
 */
export const setActiveRunId = (id: string | null): void => {
  if (id === state.activeRunId) {
    return;
  }

  state.activeRunId = id;
  notifyListeners();
};

/**
 * Subscribes to history and active-run changes. Returns an unsubscribe callback.
 */
export const subscribeToHistory = (listener: () => void): (() => void) => {
  state.listeners = state.listeners.concat([listener]);

  return () => {
    state.listeners = state.listeners.filter(existing => existing !== listener);
  };
};
