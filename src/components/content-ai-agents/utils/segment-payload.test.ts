import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import {
  hashString,
  segmentPayload,
} from './segment-payload';

const buildInputPayload = (input: unknown[], model = 'test-model'): string => JSON.stringify({
  model,
  input,
});

test('segmentPayload splits input[] into hashed segments', () => {
  const payload = buildInputPayload([
    { role: 'developer', content: 'You are the Divi 5 expert. Follow the rules.' },
    { role: 'user', content: 'Add a hero section' },
  ]);
  const segments = segmentPayload(payload);

  assertEqual(segments.length, 2);
  assertEqual(segments[0].role, 'developer');
  assertEqual(segments[0].label, 'System / Rules');
  assertEqual(segments[0].text, 'You are the Divi 5 expert. Follow the rules.');
  assertEqual(segments[0].index, 0);
  assertEqual(segments[1].role, 'user');
  assertEqual(segments[1].label, 'User turn');
  assert(0 < segments[0].tokensEst, 'expected token estimate for system text');
  assertEqual(segments[0].hash, hashString(`developer\0${segments[0].text}`));
});

test('segmentPayload labels chat history vs the latest user turn', () => {
  const payload = buildInputPayload([
    { role: 'user', content: 'First question' },
    { role: 'assistant', content: 'First answer' },
    { role: 'user', content: 'Follow up' },
  ]);
  const segments = segmentPayload(payload);

  assertEqual(segments.map(segment => segment.label), [
    'Chat history',
    'Chat history',
    'User turn',
  ]);
});

test('segmentPayload labels tool defs, tool results, and chat context', () => {
  const payload = buildInputPayload([
    { role: 'system', content: '[{"type":"function","name":"edit_module"}]' },
    { role: 'developer', content: '[CHAT CONTEXT]\nObjective: build a homepage' },
    { role: 'tool', content: '{"ok":true}' },
    { type: 'function_call', name: 'edit_module', arguments: '{"id":"1"}' },
  ]);
  const segments = segmentPayload(payload);

  assertEqual(segments[0].label, 'Tool defs');
  assertEqual(segments[1].label, 'Chat context');
  assertEqual(segments[2].label, 'Tool result');
  assertEqual(segments[3].label, 'Tool call');
  assertEqual(segments[3].role, 'assistant');
});

test('segmentPayload flattens array content items', () => {
  const payload = buildInputPayload([
    {
      role: 'user',
      content: [
        { type: 'input_text', text: 'Hello' },
        { type: 'input_text', text: 'World' },
      ],
    },
  ]);
  const segments = segmentPayload(payload);

  assertEqual(segments[0].text, 'Hello\nWorld');
});

test('segmentPayload treats generate-layout bodies as a raw prompt', () => {
  const payload = JSON.stringify({
    prompt: 'A landing page for a bakery',
    placement: 'page',
    scope: 'section',
    streamProgress: true,
  });
  const segments = segmentPayload(payload);

  assertEqual(segments.length, 1);
  assertEqual(segments[0].label, 'Raw prompt');
  assertEqual(segments[0].text, 'A landing page for a bakery');
});

test('segmentPayload does not crash on invalid JSON', () => {
  const segments = segmentPayload('not-json');

  assertEqual(segments.length, 1);
  assertEqual(segments[0].label, 'Raw prompt');
  assertEqual(segments[0].text, 'not-json');
});

test('hashString is deterministic', () => {
  assertEqual(hashString('abc'), hashString('abc'));
  assert(hashString('abc') !== hashString('abd'), 'expected different hashes for different input');
});

const ok = report();

export { ok };
