// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentAIAgentsChat } from '../content-ai-agents/tabs/chat';
import { ContentAIAgentsExecution } from '../content-ai-agents/tabs/execution';
import { ContentAIAgentsLlmInference } from '../content-ai-agents/tabs/llm-inference';
import { ContentAIAgentsPayloadEvolution } from '../content-ai-agents/tabs/payload-evolution';

/**
 * Map of AI Agents panel tabs.
 */
export const aiAgentsPanelMap = [
  {
    id: 'ai-agents-chat',
    label: __('Chat', 'et_builder'),
    component: ContentAIAgentsChat,
  },
  {
    id: 'ai-agents-execution',
    label: __('Execution', 'et_builder'),
    component: ContentAIAgentsExecution,
  },
  {
    id: 'ai-agents-llm-inference',
    label: __('LLM Inference Requests', 'et_builder'),
    component: ContentAIAgentsLlmInference,
  },
  {
    id: 'ai-agents-payload-evolution',
    label: __('Payload Evolution', 'et_builder'),
    component: ContentAIAgentsPayloadEvolution,
  },
];
