import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import { mergeHistoryEntry } from './build-history-entry';
import {
  type CapturedRequest,
  type HistoryEntry,
} from './history-store';

const createRequest = (id: string, startedAt: number, payloadTokens: number): CapturedRequest => ({
  id,
  ordinal: 1,
  startedAt,
  durationMs: 1,
  caller: 'agent',
  model: 'test-model',
  segments: [],
  responseBody: null,
  payloadTokens,
  responseTokens: 0,
});

const createEntry = (id: string, requests: CapturedRequest[]): HistoryEntry => ({
  id,
  chatId: 'chat-1',
  promptText: id,
  createdAt: 1,
  updatedAt: 2,
  model: 'test-model',
  requestCount: requests.length,
  totalTokens: requests.reduce((sum, request) => sum + request.payloadTokens, 0),
  requests,
  schemaVersion: 1,
});

test('mergeHistoryEntry keeps earlier requests dropped from the live snapshot', () => {
  const existing = createEntry('turn-1', [
    createRequest('net-1', 10, 100),
    createRequest('net-2', 20, 200),
  ]);
  const incoming = createEntry('turn-1', [
    createRequest('net-2', 20, 250),
    createRequest('net-3', 30, 300),
  ]);
  const merged = mergeHistoryEntry(existing, incoming);

  assertEqual(merged.requests.map(request => request.id), ['net-1', 'net-2', 'net-3']);
  assertEqual(merged.requests[1].payloadTokens, 250);
  assertEqual(merged.requestCount, 3);
  assertEqual(merged.totalTokens, 650);
  assertEqual(merged.requests[0].ordinal, 1);
  assertEqual(merged.requests[2].ordinal, 3);
});

test('mergeHistoryEntry returns incoming when there is no existing run', () => {
  const incoming = createEntry('turn-1', [createRequest('net-1', 10, 100)]);
  const merged = mergeHistoryEntry(null, incoming);

  assert(merged === incoming, 'expected the incoming entry to be reused');
});

const ok = report();

export { ok };
