import {
  assert,
  assertEqual,
  report,
  test,
} from './test-assert';
import {
  diffLines,
  diffSegments,
} from './diff-segments';
import {
  hashString,
  type PayloadSegment,
} from './segment-payload';

const segment = (
  index: number,
  role: string,
  text: string,
  label = role,
): PayloadSegment => ({
  index,
  role,
  label,
  text,
  hash: hashString(`${role}\0${text}`),
  tokensEst: text.length,
});

test('diffSegments marks identical role+hash pairs as carried-over', () => {
  const previous = [
    segment(0, 'system', 'rules'),
    segment(1, 'user', 'hello'),
  ];
  const current = [
    segment(0, 'system', 'rules'),
    segment(1, 'user', 'hello'),
    segment(2, 'assistant', 'hi'),
  ];
  const diff = diffSegments(previous, current);

  assertEqual(diff.current.map(item => item.change), ['carried', 'carried', 'added']);
  assertEqual(diff.removed.length, 0);
});

test('diffSegments classifies same-role text changes as modified', () => {
  const previous = [segment(0, 'user', 'hello')];
  const current = [segment(0, 'user', 'hello world')];
  const diff = diffSegments(previous, current);

  assertEqual(diff.current[0].change, 'modified');
  assertEqual(diff.current[0].previous?.text, 'hello');
});

test('diffSegments lists unmatched previous segments as removed', () => {
  const previous = [
    segment(0, 'system', 'rules'),
    segment(1, 'developer', 'extra'),
    segment(2, 'user', 'hello'),
  ];
  const current = [
    segment(0, 'system', 'rules'),
    segment(1, 'user', 'hello'),
  ];
  const diff = diffSegments(previous, current);

  assertEqual(diff.current.map(item => item.change), ['carried', 'carried']);
  assertEqual(diff.removed.map(item => item.text), ['extra']);
});

test('diffSegments prefers hash identity when order shifts', () => {
  const rules = segment(0, 'system', 'rules');
  const tools = segment(1, 'system', '[{"type":"function"}]');
  const diff = diffSegments(
    [rules, tools],
    [tools, rules],
  );

  assertEqual(diff.current[0].change, 'carried');
  assertEqual(diff.current[0].segment.text, tools.text);
  assertEqual(diff.current[1].change, 'carried');
  assertEqual(diff.current[1].segment.text, rules.text);
});

test('diffLines produces add and remove rows', () => {
  const lines = diffLines('alpha\nbeta\ngamma', 'alpha\nbeta-two\ngamma');

  assertEqual(lines, [
    { type: 'same', text: 'alpha' },
    { type: 'remove', text: 'beta' },
    { type: 'add', text: 'beta-two' },
    { type: 'same', text: 'gamma' },
  ]);
});

test('diffLines treats the first request (empty previous) as all adds', () => {
  const lines = diffLines('', 'one\ntwo');

  assertEqual(lines, [
    { type: 'add', text: 'one' },
    { type: 'add', text: 'two' },
  ]);
});

test('all-added when previous segments are empty', () => {
  const diff = diffSegments([], [segment(0, 'user', 'hello')]);

  assertEqual(diff.current[0].change, 'added');
  assert(0 === diff.removed.length, 'expected no removals against an empty previous payload');
});

const ok = report();

export { ok };
