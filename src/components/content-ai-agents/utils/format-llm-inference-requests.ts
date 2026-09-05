// Local dependencies.
import { formatJsonContent } from './format-json-content';
import { type NetworkRecord } from './network-recorder';

const formatBodyForExport = (body: string | null): string => {
  if (!body?.trim()) {
    return '(empty)';
  }

  return formatJsonContent(body).copyValue;
};

/**
 * Serializes a single LLM inference request for clipboard export.
 */
export const formatLlmInferenceRequestForCopy = (
  record: NetworkRecord,
  requestNumber: number,
): string => {
  const payload = formatBodyForExport(record.requestBody);
  const response = formatBodyForExport(record.responseBody);

  return `## Request ${requestNumber}\n### Payload\n\`\`\`\n${payload}\n\`\`\`\n\n### Response\n\`\`\`\n${response}\n\`\`\``;
};

/**
 * Serializes LLM inference requests for clipboard export and performance analysis.
 *
 * Each request is numbered sequentially starting at 1.
 */
export const formatLlmInferenceRequestsForCopy = (records: NetworkRecord[]): string => {
  if (0 === records.length) {
    return '';
  }

  return records.map((record, index) => (
    formatLlmInferenceRequestForCopy(record, index + 1)
  )).join('\n\n');
};
