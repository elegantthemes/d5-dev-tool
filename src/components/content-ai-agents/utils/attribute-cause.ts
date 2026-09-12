// Local dependencies.
import { type DiffedSegment } from './diff-segments';
import { type InferenceCaller } from './extract-inference-metadata';

export type CauseKind =
  | 'tool-result'
  | 'tool-call'
  | 'chat-history'
  | 'system-rules'
  | 'tool-defs'
  | 'chat-context'
  | 'user-turn'
  | 'raw-prompt'
  | 'unknown';

export type CauseAttribution = {
  kind: CauseKind;
  label: string;
  toolName?: string;
  caller: InferenceCaller;
  tokens: number;
};

const LABEL_TO_KIND: Record<string, CauseKind> = {
  'Tool result': 'tool-result',
  'Tool call': 'tool-call',
  'Chat history': 'chat-history',
  'System / Rules': 'system-rules',
  'Tool defs': 'tool-defs',
  'Chat context': 'chat-context',
  'User turn': 'user-turn',
  'Raw prompt': 'raw-prompt',
};

const TOOL_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_:-]{0,80}$/;
const JSON_NAME_PATTERN = /"name"\s*:\s*"([A-Za-z_][A-Za-z0-9_:-]{0,80})"/;
const TOOL_HEADING_PATTERN = /^Tool:\s*(.+)$/m;

const KIND_HEADINGS: Record<CauseKind, string> = {
  'tool-result': 'Tool result',
  'tool-call': 'Tool call',
  'chat-history': 'Chat history',
  'system-rules': 'System / Rules',
  'tool-defs': 'Tool defs',
  'chat-context': 'Chat context',
  'user-turn': 'User turn',
  'raw-prompt': 'Raw prompt',
  unknown: 'Unknown',
};

/**
 * Maps a payload-segment label to a cause kind. Unknown labels stay `unknown`.
 */
export const kindFromSegmentLabel = (label: string): CauseKind => (
  LABEL_TO_KIND[label] ?? 'unknown'
);

const isUsableToolName = (value: string): boolean => TOOL_NAME_PATTERN.test(value);

const readJsonName = (text: string): string | null => {
  const trimmed = text.trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { name?: unknown } | Array<{ name?: unknown }>;

    if (Array.isArray(parsed)) {
      const named = parsed.find(item => 'string' === typeof item?.name && isUsableToolName(item.name));

      return 'string' === typeof named?.name ? named.name : null;
    }

    if ('string' === typeof parsed.name && isUsableToolName(parsed.name)) {
      return parsed.name;
    }
  } catch {
    // Fall through to regex extraction.
  }

  const match = trimmed.match(JSON_NAME_PATTERN);

  return match?.[1] ?? null;
};

/**
 * Best-effort tool name from a flattened tool-call / tool-result segment.
 *
 * Persisted segments only store text, so this parses the first line, a JSON
 * `name` field, or a `Tool:` heading. Returns null when nothing is parseable.
 */
export const parseToolName = (text: string): string | null => {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  const jsonName = readJsonName(trimmed);

  if (jsonName) {
    return jsonName;
  }

  const heading = trimmed.match(TOOL_HEADING_PATTERN)?.[1]?.trim();

  if (heading && isUsableToolName(heading)) {
    return heading;
  }

  const firstLine = trimmed.split('\n', 1)[0]?.trim() ?? '';

  if (isUsableToolName(firstLine)) {
    return firstLine;
  }

  return null;
};

/**
 * Token contribution of an added/modified segment toward a request's growth.
 */
export const contributionTokens = (item: DiffedSegment): number => {
  if ('added' === item.change) {
    return item.segment.tokensEst;
  }

  if ('modified' === item.change) {
    return Math.max(0, item.segment.tokensEst - (item.previous?.tokensEst ?? 0));
  }

  return 0;
};

const buildCauseLabel = (kind: CauseKind, segmentLabel: string, toolName: string | null): string => {
  const heading = KIND_HEADINGS[kind];

  if (toolName && ('tool-result' === kind || 'tool-call' === kind)) {
    return `${heading}: ${toolName}`;
  }

  if ('unknown' === kind && segmentLabel.trim()) {
    return segmentLabel;
  }

  return heading;
};

/**
 * Maps a diffed segment to a cause attribution (kind, tool name, caller, tokens).
 */
export const attributeCause = (
  item: DiffedSegment,
  caller: InferenceCaller,
): CauseAttribution => {
  const kind     = kindFromSegmentLabel(item.segment.label);
  const toolName = ('tool-result' === kind || 'tool-call' === kind)
    ? parseToolName(item.segment.text)
    : null;
  const tokens   = contributionTokens(item);

  return {
    kind,
    label: buildCauseLabel(kind, item.segment.label, toolName),
    ...(toolName ? { toolName } : {}),
    caller,
    tokens,
  };
};
