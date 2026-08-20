// Local dependencies.
import { getNetworkRole } from './attribute-network-records';
import { type NetworkRecord } from './network-recorder';

/**
 * Returns captured network records classified as LLM inference, in chronological order.
 */
export const filterInferenceRecords = (records: NetworkRecord[]): NetworkRecord[] => (
  records
    .filter(record => 'agent-inference' === getNetworkRole(record.url))
    .sort((left, right) => left.startedAt - right.startedAt)
);
