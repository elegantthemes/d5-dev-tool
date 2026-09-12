import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import {
  HISTORY_MAX_ENTRIES,
  HISTORY_STORAGE_KEY,
  clearHistory,
  configureHistoryStorage,
  getActiveRunId,
  getEntry,
  listEntries,
  loadHistory,
  resetHistoryStoreForTests,
  setActiveRunId,
  updateEntryDescription,
  upsertEntry,
  type HistoryEntry,
  type HistoryStorage,
} from './history-store';

const createStorage = (): HistoryStorage & { data: Record<string, string> } => {
  const data: Record<string, string> = {};

  return {
    data,
    getItem: (key: string): string | null => data[key] ?? null,
    setItem: (key: string, value: string): void => {
      data[key] = value;
    },
    removeItem: (key: string): void => {
      delete data[key];
    },
  };
};

const createEntry = (id: string, promptText = id): HistoryEntry => ({
  id,
  chatId: 'chat-1',
  promptText,
  createdAt: 1,
  updatedAt: 1,
  model: 'test-model',
  requestCount: 1,
  totalTokens: 10,
  requests: [{
    id: `${id}-req`,
    ordinal: 1,
    startedAt: 1,
    durationMs: 1,
    caller: 'agent',
    model: 'test-model',
    segments: [],
    responseBody: null,
    payloadTokens: 8,
    responseTokens: 2,
  }],
  schemaVersion: 1,
});

const setup = (storage = createStorage()) => {
  resetHistoryStoreForTests();
  configureHistoryStorage(storage);

  return storage;
};

test('upsertEntry stores newest first and is idempotent by id', () => {
  const storage = setup();

  upsertEntry(createEntry('run-a', 'first'));
  upsertEntry(createEntry('run-b', 'second'));
  upsertEntry({
    ...createEntry('run-a', 'first updated'),
    requestCount: 2,
    totalTokens: 20,
  });

  const entries = listEntries();

  assertEqual(entries.map(entry => entry.id), ['run-a', 'run-b']);
  assertEqual(entries[0].promptText, 'first updated');
  assertEqual(entries[0].requestCount, 2);
  assert(Boolean(storage.data[HISTORY_STORAGE_KEY]), 'expected history to persist to storage');
});

test('loadHistory hydrates from storage', () => {
  const storage = createStorage();
  storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify({
    schemaVersion: 1,
    entries: [createEntry('stored-run')],
  }));
  setup(storage);

  const entries = loadHistory();

  assertEqual(entries.length, 1);
  assertEqual(entries[0].id, 'stored-run');
});

test('clearHistory wipes memory, storage, and the active run', () => {
  const storage = setup();

  upsertEntry(createEntry('run-a'));
  setActiveRunId('run-a');
  clearHistory();

  assertEqual(listEntries().length, 0);
  assertEqual(getActiveRunId(), null);
  assertEqual(storage.data[HISTORY_STORAGE_KEY], undefined);
});

test('evicts oldest runs once the cap is exceeded', () => {
  setup();

  for (let index = 0; index < HISTORY_MAX_ENTRIES + 3; index += 1) {
    upsertEntry(createEntry(`run-${index}`));
  }

  const entries = listEntries();

  assertEqual(entries.length, HISTORY_MAX_ENTRIES);
  assertEqual(entries[0].id, `run-${HISTORY_MAX_ENTRIES + 2}`);
  assertEqual(getEntry('run-0'), null);
});

test('quota errors drop oldest entries instead of throwing', () => {
  const data: Record<string, string> = {};
  const storage: HistoryStorage = {
    getItem: (key: string): string | null => data[key] ?? null,
    setItem: (key: string, value: string): void => {
      if (80 < value.length && 1 < JSON.parse(value).entries.length) {
        const error = new Error('quota');
        error.name = 'QuotaExceededError';
        throw error;
      }

      data[key] = value;
    },
    removeItem: (key: string): void => {
      delete data[key];
    },
  };

  setup(storage);
  upsertEntry(createEntry('run-old', 'old prompt'));
  upsertEntry(createEntry('run-new', 'new prompt that is intentionally longer'));

  const entries = listEntries();

  assert(0 < entries.length, 'expected at least the newest run to remain');
  assertEqual(entries[0].id, 'run-new');
});

test('updateEntryDescription saves a note and later upserts keep it', () => {
  setup();
  upsertEntry(createEntry('run-a', 'Add a hero'));
  updateEntryDescription('run-a', 'Homepage hero test');

  assertEqual(getEntry('run-a')?.description, 'Homepage hero test');

  upsertEntry({
    ...createEntry('run-a', 'Add a hero'),
    requestCount: 2,
  });

  assertEqual(getEntry('run-a')?.description, 'Homepage hero test');
  assertEqual(getEntry('run-a')?.requestCount, 2);
});

test('quota errors do not wipe the run still held in memory', () => {
  const storage: HistoryStorage = {
    getItem: (): string | null => null,
    setItem: (): void => {
      const error = new Error('quota');
      error.name = 'QuotaExceededError';
      throw error;
    },
    removeItem: (): void => undefined,
  };

  setup(storage);
  upsertEntry(createEntry('run-huge', 'x'.repeat(4000)));

  assertEqual(listEntries().length, 1);
  assertEqual(listEntries()[0].id, 'run-huge');
});

test('duplicate segment text is compacted in storage and restored on load', () => {
  const storage = setup();
  const shared = {
    index: 0,
    role: 'system',
    label: 'System',
    text: 'Create responsive font size variables and reuse this slab.',
    hash: 'abc123ff',
    tokensEst: 12,
  };

  upsertEntry({
    ...createEntry('run-a', 'font variables'),
    requestCount: 2,
    requests: [
      {
        ...createEntry('run-a').requests[0],
        id: 'r1',
        ordinal: 1,
        segments: [shared],
      },
      {
        ...createEntry('run-a').requests[0],
        id: 'r2',
        ordinal: 2,
        startedAt: 2,
        segments: [shared],
      },
    ],
  });

  const stored = JSON.parse(storage.data[HISTORY_STORAGE_KEY]) as {
    entries: Array<{ requests: Array<{ segments: Array<{ text: string }> }> }>;
  };

  assertEqual(stored.entries[0].requests[0].segments[0].text, shared.text);
  assertEqual(stored.entries[0].requests[1].segments[0].text, '');

  resetHistoryStoreForTests();
  configureHistoryStorage(storage);

  const loaded = loadHistory();

  assertEqual(loaded[0].requests[1].segments[0].text, shared.text);
});

const ok = report();

export { ok };
