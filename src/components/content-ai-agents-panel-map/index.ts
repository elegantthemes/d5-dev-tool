// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentAIAgentsOverview } from '../content-ai-agents/tabs/overview';
import { ContentAIAgentsChat } from '../content-ai-agents/tabs/chat';

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
];
