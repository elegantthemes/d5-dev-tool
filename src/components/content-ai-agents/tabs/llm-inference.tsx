// External dependencies.
import React, {
  ReactElement,
  useMemo,
} from 'react';

// Local dependencies.
import { LlmInferenceRequestsDebug } from '../components/llm-inference-requests-debug';
import { filterInferenceRecords } from '../utils/filter-inference-records';
import { useNetworkRecords } from '../use-network-records';
import '../styles.scss';

/**
 * Tab that lists every captured LLM inference payload and response.
 */
export const ContentAIAgentsLlmInference = (): ReactElement => {
  const {
    records,
    installedAt,
  } = useNetworkRecords();
  const inferenceRecords = useMemo(
    () => filterInferenceRecords(records),
    [records],
  );

  return (
    <div className="d5-dev-tool-ai-agent">
      <LlmInferenceRequestsDebug
        records={inferenceRecords}
        installedAt={installedAt}
      />
    </div>
  );
};
