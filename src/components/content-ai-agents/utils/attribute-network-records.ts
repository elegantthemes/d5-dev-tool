// Local dependencies.
import { extractInferenceCaller } from './extract-inference-metadata';
import { type NetworkRecord } from './network-recorder';

export type NetworkRole =
  | 'agent-inference'
  | 'graph-persistence'
  | 'chat-persistence'
  | 'agent-config'
  | 'agent-rules'
  | 'unclassified';

export type PhaseWindow = {
  startedAt: number | null;
  endedAt: number | null;
};

export type NetworkAttribution = {
  byPhase: Record<string, NetworkRecord[]>;
  unattributed: NetworkRecord[];
};

export const NETWORK_ROLE_LABELS: Record<NetworkRole, string> = {
  'agent-config': 'Agent Config',
  'agent-inference': 'LLM Inference',
  'agent-rules': 'Agent Rules',
  'chat-persistence': 'Chat Persistence',
  'graph-persistence': 'Graph Checkpoint',
  unclassified: 'Unclassified',
};

/**
 * Phases that can legitimately own each kind of request.
 *
 * Time alone cannot attribute a request: Build phases nest and settle together,
 * so a naive window filter reports the same LLM and persistence calls under
 * every open phase. What a request *is* determines which phases could have
 * issued it; timing then picks between them.
 */
const ROLE_CANDIDATE_PHASES: Record<NetworkRole, string[]> = {
  // Planner/classifier inference, then the parent agent, then nested sub-agents.
  'agent-inference': ['phase-4', 'phase-5', 'phase-6'],
  // LangGraph checkpointer writes during parent/sub-agent runs, and the final flush.
  'graph-persistence': ['phase-5', 'phase-6', 'phase-8'],
  // Thread/message rows written pre-turn, and again once the turn settles.
  'chat-persistence': ['phase-2', 'phase-8'],
  'agent-config': ['phase-1'],
  'agent-rules': ['phase-3'],
  unclassified: [],
};

const INFERENCE_CALLER_PHASE: Record<string, string> = {
  planner: 'phase-4',
  'planner-scope': 'phase-4',
  'tool-router': 'phase-4',
  agent: 'phase-5',
  ask: 'phase-5',
  layout: 'phase-5',
  'sub-agent': 'phase-6',
};

export const getNetworkRole = (url: string): NetworkRole => {
  if (/\/api\/v\d+\/agent\//i.test(url) || /\/agent\/generate-layout/i.test(url)) {
    return 'agent-inference';
  }

  if (/ai-agent-chat\/(?:checkpoints|pending-writes)\b/i.test(url)) {
    return 'graph-persistence';
  }

  if (/ai-agent-chat\/(?:threads|messages|restore-points)/i.test(url)) {
    return 'chat-persistence';
  }

  if (/ai-agent\/(?:commands|models)\b/i.test(url)) {
    return 'agent-config';
  }

  if (/ai-agent\/rules\b/i.test(url)) {
    return 'agent-rules';
  }

  return 'unclassified';
};

const windowContains = (window: PhaseWindow, timestamp: number): boolean => (
  null !== window.startedAt
  && window.startedAt <= timestamp
  && (null === window.endedAt || timestamp <= window.endedAt)
);

/**
 * Picks the single phase that issued a request.
 *
 * Only phases that could own the request's role and had already started are
 * eligible. A phase whose window still contains the request wins; otherwise the
 * most recently started eligible phase does, which is what catches persistence
 * that lands just after a turn settles.
 */
const findOwningPhase = (
  record: NetworkRecord,
  windows: Record<string, PhaseWindow>,
): string => {
  const candidates = ROLE_CANDIDATE_PHASES[getNetworkRole(record.url)].filter(phaseId => {
    const window = windows[phaseId];

    return Boolean(window) && null !== window.startedAt && window.startedAt <= record.startedAt;
  });

  if (0 === candidates.length) {
    return '';
  }

  if ('agent-inference' === getNetworkRole(record.url)) {
    const callerPhase = INFERENCE_CALLER_PHASE[
      extractInferenceCaller(record.requestBody, record.url)
    ];

    if (callerPhase && -1 !== candidates.indexOf(callerPhase)) {
      return callerPhase;
    }
  }

  const containing = candidates.filter(
    phaseId => windowContains(windows[phaseId], record.startedAt),
  );
  const preferred = 0 < containing.length ? containing : candidates;

  return preferred.reduce((latest, phaseId) => (
    (windows[phaseId].startedAt ?? 0) > (windows[latest].startedAt ?? 0) ? phaseId : latest
  ), preferred[0]);
};

/**
 * Assigns every captured request to at most one Build phase.
 */
export const attributeNetworkRecords = (
  records: NetworkRecord[],
  windows: Record<string, PhaseWindow>,
  phaseIds: string[],
): NetworkAttribution => {
  const byPhase = phaseIds.reduce<Record<string, NetworkRecord[]>>((grouped, phaseId) => {
    grouped[phaseId] = [];

    return grouped;
  }, {});
  const unattributed: NetworkRecord[] = [];

  records.forEach(record => {
    const phaseId = findOwningPhase(record, windows);

    if (phaseId && byPhase[phaseId]) {
      byPhase[phaseId].push(record);

      return;
    }

    unattributed.push(record);
  });

  return {
    byPhase,
    unattributed,
  };
};
