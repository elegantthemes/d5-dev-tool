// Local dependencies.
import {
  parseToolCallStep,
  type AssistantStep,
} from './parse-tool-call';

export type DebugStep = {
  id?: string;
  type?: string;
  label?: string;
  content?: string;
  status?: string;
  agentType?: string;
  activityStatus?: string;
  [key: string]: unknown;
};

type ToolResultPayload = {
  success?: boolean;
  error?: unknown;
};

/**
 * Failure markers for tool results that are not parseable JSON, e.g. plain
 * strings or payloads truncated by the agent's own stringifier. Deliberately
 * narrow: an `"error": null` key or the word "error" appearing anywhere in a
 * successful payload must not match.
 */
const RESULT_FAILURE_PATTERNS = [
  /"success"\s*:\s*false/i,
  /"error"\s*:\s*"[^"]/i,
  /^\s*(?:error|failed|failure|exception)\b/i,
];

const STEP_KIND_LABELS: Record<string, string> = {
  approval: 'Approval Request',
  clarification: 'Clarification',
  'media-pick': 'Media Pick',
  notes: 'Notes',
  routing: 'Routing',
  status: 'Status',
  sub_agent: 'Sub Agent',
  summarizing: 'Summarizing',
  text: 'Assistant Response',
  thinking: 'System / Thinking',
  todos: 'Todos',
  'tool-selection': 'Tool Selection',
  tool_call: 'Tool Call',
};

// Values longer than this get their own collapsed block instead of an inline row.
const COMPACT_LENGTH_LIMIT = 72;

const PREVIEW_LENGTH_LIMIT = 140;

export const getStepKindLabel = (type?: string): string => (
  STEP_KIND_LABELS[type ?? ''] ?? (type || 'Step')
);

/**
 * Turns a state key into a readable field label, e.g. `argsPreview` to `Args Preview`.
 */
export const formatFieldLabel = (key: string): string => key
  .replace(/[_-]+/g, ' ')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, character => character.toUpperCase());

/**
 * True when a value is small enough to read inline rather than behind a toggle.
 */
export const isCompactStepValue = (value: unknown): boolean => {
  if (null === value || undefined === value) {
    return true;
  }

  if ('boolean' === typeof value || 'number' === typeof value) {
    return true;
  }

  if ('string' === typeof value) {
    return COMPACT_LENGTH_LIMIT >= value.length && -1 === value.indexOf('\n');
  }

  if (Array.isArray(value)) {
    return 0 === value.length;
  }

  if ('object' === typeof value) {
    return 0 === Object.keys(value as Record<string, unknown>).length;
  }

  return false;
};

export const formatCompactStepValue = (value: unknown): string => {
  if (undefined === value) {
    return '—';
  }

  if (null === value) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return '[]';
  }

  if ('string' === typeof value) {
    return value || '(empty)';
  }

  if ('object' === typeof value) {
    return '{}';
  }

  return String(value);
};

/**
 * Single-line excerpt used as a step's collapsed subtitle.
 */
export const getStepPreview = (step: DebugStep): string => {
  const candidates = [step.content, step.goal, step.argsPreview, step.status, step.subAgentHandleId];
  const source = candidates.find(
    candidate => 'string' === typeof candidate && Boolean(candidate.trim()),
  ) as string | undefined;

  if (!source) {
    return '';
  }

  const collapsed = source.replace(/\s+/g, ' ').trim();

  return PREVIEW_LENGTH_LIMIT < collapsed.length
    ? `${collapsed.slice(0, PREVIEW_LENGTH_LIMIT)}…`
    : collapsed;
};

export const stepTextLooksLikeError = (value: unknown): boolean => (
  'string' === typeof value
  && Boolean(value)
  && /(?:\berror\b|\bfailed\b|\bfailure\b|\bexception\b|\baborted\b)/i.test(value)
);

/**
 * True when the orchestrator marked this step's activity as failed. This is the
 * only explicit failure flag Divi writes onto an assistant step; working step
 * types (`thinking`, `tool_call`, `routing`, `status`) never carry an error
 * status, so step prose must not be used to infer failure.
 */
export const stepActivityFailed = (step: DebugStep): boolean => 'failed' === step.activityStatus;

/**
 * True when a tool call reported failure.
 *
 * Divi encodes tool failure inside the `Result:` JSON of the step content, as
 * either `success: false` or a non-empty `error`. Only that section is
 * inspected: the surrounding `Tool:`/`Params:` text routinely contains the word
 * "error" on perfectly successful calls.
 */
export const toolStepHasError = (step: DebugStep): boolean => {
  if (stepActivityFailed(step)) {
    return true;
  }

  const { result } = parseToolCallStep(step as AssistantStep);

  if (!result) {
    return false;
  }

  try {
    const parsed = JSON.parse(result) as ToolResultPayload | null;

    if (parsed && 'object' === typeof parsed) {
      if (false === parsed.success) {
        return true;
      }

      return 'string' === typeof parsed.error
        ? Boolean(parsed.error.trim())
        : Boolean(parsed.error);
    }
  } catch {
    // Not JSON, so fall through to marker matching below.
  }

  return RESULT_FAILURE_PATTERNS.some(pattern => pattern.test(result));
};

/**
 * Maps a step status onto the shared phase badge colors.
 */
export const getStepStatusVariant = (step: DebugStep): string => {
  if (stepTextLooksLikeError(step.status) || stepTextLooksLikeError(step.label) || stepTextLooksLikeError(step.subAgentStatus)) {
    return 'error';
  }

  const status = (
    'string' === typeof step.subAgentStatus ? step.subAgentStatus : ('string' === typeof step.status ? step.status : '')
  ).toLowerCase();

  if (-1 !== ['success', 'succeeded', 'complete', 'completed', 'done'].indexOf(status)) {
    return 'observed';
  }

  if (-1 !== ['pending', 'running', 'in_progress', 'streaming', 'active'].indexOf(status)) {
    return 'active';
  }

  if (-1 !== ['failed', 'error'].indexOf(status)) {
    return 'error';
  }

  if (-1 !== ['aborted', 'cancelled'].indexOf(status)) {
    return 'aborted';
  }

  return 'waiting';
};
