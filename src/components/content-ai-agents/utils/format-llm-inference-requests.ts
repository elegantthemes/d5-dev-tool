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
 * Serializes LLM inference requests for clipboard export and performance analysis.
 *
 * Each request is numbered sequentially starting at 1.
 */
export const formatLlmInferenceRequestsForCopy = (records: NetworkRecord[]): string => {
  if (0 === records.length) {
    return '';
  }

  return records.map((record, index) => {
    const requestNumber = index + 1;
    const payload = formatBodyForExport(record.requestBody);
    const response = formatBodyForExport(record.responseBody);

    return `## Request ${requestNumber}\n### Payload\n${payload}\n\n### Response\n${response}`;
  }).join('\n\n');
};
