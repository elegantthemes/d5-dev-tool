export type AssistantStep = {
  type?: string;
  label?: string;
  content?: string;
  argsPreview?: string;
  status?: string;
  actionId?: string;
};

export type ParsedToolCall = {
  toolName: string;
  params: string | null;
  result: string | null;
  status: string | null;
  argsPreview: string | null;
  rawContent: string | null;
};

const extractSection = (content: string, sectionName: 'Params' | 'Result'): string | null => {
  const pattern = new RegExp(`${sectionName}:\\s*\\n([\\s\\S]*?)(?:\\n\\n(?:Tool:|Params:|Result:)|$)`);
  const match = content.match(pattern);

  return match?.[1]?.trim() ?? null;
};

/**
 * Normalizes a tool-call step into tool name, params, and result for debug UI.
 */
export const parseToolCallStep = (step: AssistantStep): ParsedToolCall => {
  const rawContent = step.content ?? null;
  const toolName = step.label || 'Unknown tool';
  let params = step.argsPreview?.trim() || null;
  let result: string | null = null;

  if (rawContent) {
    const toolMatch = rawContent.match(/^Tool:\s*(.+?)(?:\n\n|$)/);
    const parsedParams = extractSection(rawContent, 'Params');
    const parsedResult = extractSection(rawContent, 'Result');

    if (toolMatch?.[1]?.trim()) {
      return {
        toolName: toolMatch[1].trim(),
        params: parsedParams ?? params,
        result: parsedResult,
        status: step.status ?? null,
        argsPreview: step.argsPreview ?? null,
        rawContent,
      };
    }

    params = parsedParams ?? params;
    result = parsedResult;
  }

  return {
    toolName,
    params,
    result,
    status: step.status ?? null,
    argsPreview: step.argsPreview ?? null,
    rawContent,
  };
};

/**
 * Returns true when a step represents a tool invocation worth surfacing in debug UI.
 */
export const isToolDebugStep = (step: AssistantStep): boolean => (
  'tool_call' === step.type || 'sub_agent' === step.type || 'approval' === step.type || 'tool-selection' === step.type
);
