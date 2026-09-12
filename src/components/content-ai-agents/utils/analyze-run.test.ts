import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import {
  analyzeRun,
  isResponseTokensKnown,
  SPIKE_MAD_K,
} from './analyze-run';
import {
  HISTORY_SCHEMA_VERSION,
  type CapturedRequest,
  type HistoryEntry,
} from './history-store';
import { hashString, type PayloadSegment } from './segment-payload';

const segment = (
  index: number,
  role: string,
  label: string,
  text: string,
  tokensEst: number,
): PayloadSegment => ({
  index,
  role,
  label,
  text,
  hash: hashString(`${role}\0${text}`),
  tokensEst,
});

const request = (
  ordinal: number,
  partial: Partial<CapturedRequest> & { segments: PayloadSegment[] },
): CapturedRequest => ({
  id: `req-${ordinal}`,
  ordinal,
  startedAt: ordinal,
  durationMs: 1,
  caller: 'agent',
  model: 'test-model',
  responseBody: 'ok',
  payloadTokens: partial.segments.reduce((sum, item) => sum + item.tokensEst, 0),
  responseTokens: 10,
  ...partial,
});

const entry = (requests: CapturedRequest[]): HistoryEntry => ({
  id: 'run-1',
  chatId: 'chat-1',
  promptText: 'Build a hero',
  createdAt: 1,
  updatedAt: 1,
  model: 'test-model',
  requestCount: requests.length,
  totalTokens: requests.reduce((sum, item) => sum + item.payloadTokens + item.responseTokens, 0),
  requests,
  schemaVersion: HISTORY_SCHEMA_VERSION,
});

const rules = segment(0, 'system', 'System / Rules', 'You are the Divi 5 expert.', 400);
const tools = segment(1, 'system', 'Tool defs', '[{"type":"function"}]', 800);
const userTurn = (text: string, tokensEst: number) => (
  segment(2, 'user', 'User turn', text, tokensEst)
);

test('analyzeRun treats identical (role, hash) slabs as lineage ballast', () => {
  const analysis = analyzeRun(entry([
    request(1, { segments: [rules, tools, userTurn('hello', 20)] }),
    request(2, { segments: [rules, tools, userTurn('hello', 20)] }),
    request(3, { segments: [rules, tools, userTurn('hello', 20)] }),
  ]));
  const rulesLineage = analysis.lineages.find(lineage => 'System / Rules' === lineage.label);
  const toolsLineage = analysis.lineages.find(lineage => 'Tool defs' === lineage.label);

  assert(Boolean(rulesLineage), 'expected a rules lineage');
  assertEqual(rulesLineage?.occurrences, 3);
  assertEqual(rulesLineage?.firstOrdinal, 1);
  assertEqual(rulesLineage?.lastOrdinal, 3);
  assertEqual(rulesLineage?.carriedTokenCost, 800);
  assertEqual(toolsLineage?.carriedTokenCost, 1600);
  assertEqual(analysis.ballastTokens, 800 + 1600 + 40);
  assert(0 < analysis.totalRedundancyRatio, 'expected a positive redundancy ratio');
});

test('analyzeRun still counts a reordered identical slab as carried', () => {
  const analysis = analyzeRun(entry([
    request(1, { segments: [rules, tools] }),
    request(2, { segments: [tools, rules] }),
  ]));
  const second = analysis.requests[1];

  assertEqual(second.carriedTokens, 1200);
  assertEqual(second.addedTokens, 0);
  assertEqual(analysis.lineages[0].occurrences, 2);
});

test('analyzeRun attributes the top cause to the largest added/modified segment', () => {
  const analysis = analyzeRun(entry([
    request(1, { segments: [rules, userTurn('hello', 20)] }),
    request(2, {
      caller: 'agent',
      segments: [
        rules,
        userTurn('hello', 20),
        segment(3, 'tool', 'Tool result', 'edit_module\n{"ok":true}', 1800),
      ],
    }),
  ]));
  const second = analysis.requests[1];

  assertEqual(second.addedTokens, 1800);
  assertEqual(second.topCause?.kind, 'tool-result');
  assertEqual(second.topCause?.toolName, 'edit_module');
  assertEqual(second.topCause?.label, 'Tool result: edit_module');
  assertEqual(second.topCause?.caller, 'agent');
  assertEqual(second.topCause?.tokens, 1800);
});

test('analyzeRun flags a MAD outlier as a payload spike and leaves the rest receded', () => {
  const analysis = analyzeRun(entry([
    request(1, { payloadTokens: 100, segments: [userTurn('a', 100)] }),
    request(2, { payloadTokens: 110, segments: [userTurn('b', 110)] }),
    request(3, { payloadTokens: 105, segments: [userTurn('c', 105)] }),
    request(4, { payloadTokens: 108, segments: [userTurn('d', 108)] }),
    request(5, { payloadTokens: 2000, segments: [userTurn('e', 2000)] }),
  ]));

  assertEqual(SPIKE_MAD_K, 3);
  assertEqual(analysis.spikeOrdinals, [5]);
  assertEqual(analysis.requests[4].payloadIsSpike, true);
  assertEqual(analysis.requests[1].payloadIsSpike, false);
  assert(0 < analysis.requests[4].payloadSpikeScore, 'expected a positive spike score for the hop');
  assertEqual(analysis.peakPayloadOrdinal, 5);
});

test('analyzeRun does not flag spikes on a single-request run', () => {
  const analysis = analyzeRun(entry([
    request(1, { segments: [rules, tools, userTurn('hello', 20)] }),
  ]));

  assertEqual(analysis.requests.length, 1);
  assertEqual(analysis.requests[0].payloadDelta, 0);
  assertEqual(analysis.requests[0].payloadIsSpike, false);
  assertEqual(analysis.spikeOrdinals.length, 0);
  assertEqual(analysis.peakPayloadOrdinal, 1);
  assertEqual(analysis.lineages[0].carriedTokenCost, 0);
});

test('analyzeRun marks unknown output as not a spike instead of a zero-spike', () => {
  const analysis = analyzeRun(entry([
    request(1, {
      responseBody: null,
      responseTokens: 0,
      segments: [userTurn('a', 100)],
    }),
    request(2, {
      responseBody: null,
      responseTokens: 0,
      segments: [userTurn('b', 110)],
    }),
    request(3, {
      responseBody: 'a large streamed reply',
      responseTokens: 900,
      segments: [userTurn('c', 105)],
    }),
  ]));

  assertEqual(analysis.requests[0].responseTokensKnown, false);
  assertEqual(analysis.requests[1].responseTokensKnown, false);
  assertEqual(analysis.requests[2].responseTokensKnown, true);
  assertEqual(analysis.requests[0].responseIsSpike, false);
  assertEqual(analysis.requests[1].responseIsSpike, false);
});

test('isResponseTokensKnown treats recorder placeholders as unknown', () => {
  assertEqual(isResponseTokensKnown(request(1, {
    responseBody: '[Stream incomplete]',
    responseTokens: 0,
    segments: [],
  })), false);
  assertEqual(isResponseTokensKnown(request(1, {
    responseBody: 'data: {"delta":"hi"}',
    responseTokens: 0,
    segments: [],
  })), true);
});

test('analyzeRun is deterministic for identical input', () => {
  const run = entry([
    request(1, { segments: [rules, tools, userTurn('hello', 20)] }),
    request(2, {
      segments: [
        rules,
        tools,
        userTurn('hello', 20),
        segment(3, 'user', 'Chat history', 'hello', 20),
        userTurn('follow up', 30),
      ],
    }),
  ]);

  assertEqual(analyzeRun(run), analyzeRun(run));
});

const ok = report();

export { ok };
