// Divi dependencies.
import { useSelect } from '@divi/data';

export const AI_AGENT_STORE = 'divi/ai-agent';

type AiAgentSelectors = Record<string, (...args: unknown[]) => unknown>;

/**
 * Returns the `divi/ai-agent` store selectors, or null when unavailable.
 */
export const useAiAgentSelectors = (): AiAgentSelectors | null => useSelect(selectStore => {
  const store = selectStore(AI_AGENT_STORE);

  if (!store) {
    return null;
  }

  return store as AiAgentSelectors;
});
