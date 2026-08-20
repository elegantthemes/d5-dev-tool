// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentAIAgentsOverview } from '../content-ai-agents/tabs/overview';
import { ContentAIAgentsChat } from '../content-ai-agents/tabs/chat';
import { ContentAIAgentsExecution } from '../content-ai-agents/tabs/execution';
import { ContentAIAgentsLlmInference } from '../content-ai-agents/tabs/llm-inference';

/**
 * Map of AI Agents panel tabs.
 */
export const aiAgentsPanelMap = [
  {
    id: 'ai-agents-overview',
    label: __('Overview', 'et_builder'),
    component: ContentAIAgentsOverview,
  },
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
];
