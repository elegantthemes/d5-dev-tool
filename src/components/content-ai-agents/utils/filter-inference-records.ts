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

/**
 * Limits inference records to a single chat turn window.
 *
 * Requests are matched on `startedAt`. When the turn is still in progress the
 * upper bound is left open so tokens accumulate until settlement.
 */
export const filterInferenceRecordsForTurn = (
  records: NetworkRecord[],
  turnStartedAt: number | null,
  turnEndedAt: number | null,
): NetworkRecord[] => {
  if (null === turnStartedAt && null === turnEndedAt) {
    return records;
  }

  return records.filter(record => {
    if (null !== turnStartedAt && record.startedAt < turnStartedAt) {
      return false;
    }

    if (null !== turnEndedAt) {
      const requestTimestamp = record.endedAt ?? record.startedAt;

      return requestTimestamp <= turnEndedAt;
    }

    return true;
  });
};
