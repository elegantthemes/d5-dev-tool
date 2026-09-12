import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import { analyzeRun } from './analyze-run';
import { formatRunForCopy } from './format-run-for-copy';
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
const user = segment(1, 'user', 'User turn', 'hello', 20);
const tool = segment(2, 'tool', 'Tool result', 'edit_module\n{"ok":true}', 1800);

test('formatRunForCopy includes the prompt, summary, and every request row', () => {
  const run = entry([
    request(1, { segments: [rules, user] }),
    request(2, { segments: [rules, user, tool] }),
  ]);
  const text = formatRunForCopy(run, analyzeRun(run));

  assert(text.includes('Prompt: Build a hero'), 'expected the user prompt');
  assert(text.includes('Request summary'), 'expected a request summary');
  assert(text.includes('R1  sent'), 'expected request 1 in the summary');
  assert(text.includes('R2  sent'), 'expected request 2 in the summary');
  assert(text.includes('Repeated text'), 'expected repeated-text section');
  assert(text.includes('System / Rules'), 'expected the rules slab in repeated text');
  assert(text.includes('Why it grew: Tool result: edit_module'), 'expected the tool-result cause');
  assert(text.includes('edit_module\n{"ok":true}'), 'expected full new segment text');
});

test('formatRunForCopy limits details to the focused request', () => {
  const run = entry([
    request(1, { segments: [rules, user] }),
    request(2, { segments: [rules, user, tool] }),
  ]);
  const text = formatRunForCopy(run, analyzeRun(run), 'req-2');

  assert(text.includes('Showing details for: R2 only'), 'expected a focused-request note');
  assert(text.includes('Request R2'), 'expected R2 details');
  assertEqual(text.includes('Request R1\n'), false);
  assert(text.includes('R1  sent'), 'expected R1 to stay in the summary table');
});

const ok = report();

export { ok };
