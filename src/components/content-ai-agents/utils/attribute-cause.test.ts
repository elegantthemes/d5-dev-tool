import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import {
  attributeCause,
  contributionTokens,
  kindFromSegmentLabel,
  parseToolName,
} from './attribute-cause';
import { type DiffedSegment } from './diff-segments';
import { hashString, type PayloadSegment } from './segment-payload';

const segment = (
  index: number,
  role: string,
  label: string,
  text: string,
  tokensEst = text.length,
): PayloadSegment => ({
  index,
  role,
  label,
  text,
  hash: hashString(`${role}\0${text}`),
  tokensEst,
});

test('kindFromSegmentLabel maps known labels and falls back to unknown', () => {
  assertEqual(kindFromSegmentLabel('Tool result'), 'tool-result');
  assertEqual(kindFromSegmentLabel('Tool call'), 'tool-call');
  assertEqual(kindFromSegmentLabel('Chat history'), 'chat-history');
  assertEqual(kindFromSegmentLabel('System / Rules'), 'system-rules');
  assertEqual(kindFromSegmentLabel('Tool defs'), 'tool-defs');
  assertEqual(kindFromSegmentLabel('Chat context'), 'chat-context');
  assertEqual(kindFromSegmentLabel('User turn'), 'user-turn');
  assertEqual(kindFromSegmentLabel('Raw prompt'), 'raw-prompt');
  assertEqual(kindFromSegmentLabel('Assistant turn'), 'unknown');
});

test('parseToolName reads the first line of a tool-call flatten', () => {
  assertEqual(parseToolName('edit_module\n{"id":"1"}'), 'edit_module');
});

test('parseToolName reads a JSON name field', () => {
  assertEqual(
    parseToolName('{"type":"function_call","name":"edit_module","arguments":"{}"}'),
    'edit_module',
  );
});

test('parseToolName reads a Tool: heading', () => {
  assertEqual(parseToolName('Tool: get_module\n\nParams:\n{}'), 'get_module');
});

test('parseToolName returns null when nothing is parseable', () => {
  assertEqual(parseToolName('{"ok":true,"result":[]}'), null);
  assertEqual(parseToolName('not a tool name at all, just a paragraph'), null);
  assertEqual(parseToolName(''), null);
});

test('contributionTokens uses full size for added and positive delta for modified', () => {
  const added: DiffedSegment = {
    segment: segment(0, 'tool', 'Tool result', 'new result', 1800),
    change: 'added',
  };
  const modified: DiffedSegment = {
    segment: segment(0, 'user', 'Chat history', 'hello world', 900),
    change: 'modified',
    previous: segment(0, 'user', 'Chat history', 'hello', 200),
  };
  const carried: DiffedSegment = {
    segment: segment(0, 'system', 'System / Rules', 'rules', 400),
    change: 'carried',
  };

  assertEqual(contributionTokens(added), 1800);
  assertEqual(contributionTokens(modified), 700);
  assertEqual(contributionTokens(carried), 0);
});

test('attributeCause includes tool name and caller for a tool result', () => {
  const cause = attributeCause({
    segment: segment(2, 'tool', 'Tool result', 'edit_module\n{"ok":true}', 1800),
    change: 'added',
  }, 'agent');

  assertEqual(cause.kind, 'tool-result');
  assertEqual(cause.toolName, 'edit_module');
  assertEqual(cause.label, 'Tool result: edit_module');
  assertEqual(cause.caller, 'agent');
  assertEqual(cause.tokens, 1800);
});

test('attributeCause falls back to the segment label when the tool name is unparseable', () => {
  const cause = attributeCause({
    segment: segment(2, 'tool', 'Tool result', '{"ok":true}', 40),
    change: 'added',
  }, 'sub-agent');

  assertEqual(cause.kind, 'tool-result');
  assertEqual(cause.toolName, undefined);
  assertEqual(cause.label, 'Tool result');
  assertEqual(cause.caller, 'sub-agent');
});

test('attributeCause maps chat history without attempting a tool name', () => {
  const cause = attributeCause({
    segment: segment(1, 'user', 'Chat history', 'What about the hero?', 90),
    change: 'added',
  }, 'planner');

  assertEqual(cause.kind, 'chat-history');
  assertEqual(cause.toolName, undefined);
  assertEqual(cause.label, 'Chat history');
  assertEqual(cause.tokens, 90);
});

const ok = report();

export { ok };
