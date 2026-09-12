// External dependencies.
import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

// Local dependencies.
import { useAiHistory } from '../use-ai-history';
import { type HistoryEntry } from '../utils/history-store';
import '../styles.scss';

const HistorySelectorHostContext = createContext(false);

/**
 * Marks the AI Agents panel as already showing a run picker so nested tabs
 * do not render a second copy. Detached tab modals stay outside this host.
 */
export const HistorySelectorHost = ({ children }: { children: ReactNode }): ReactElement => (
  <HistorySelectorHostContext.Provider value={true}>
    {children}
  </HistorySelectorHostContext.Provider>
);

const PROMPT_PREVIEW_LENGTH = 72;
const NOTE_PREVIEW_LENGTH = 40;

const truncateText = (text: string, maxLength: number): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return '(empty prompt)';
  }

  if (maxLength >= normalized.length) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}…`;
};

const formatTimestamp = (timestamp: number): string => new Date(timestamp).toLocaleString();

const formatEntryOption = (entry: HistoryEntry): string => {
  const note = entry.description?.trim() ?? '';
  const prompt = truncateText(entry.promptText, note ? 36 : PROMPT_PREVIEW_LENGTH);
  const tokens = entry.totalTokens.toLocaleString();
  const stats = `${entry.requestCount} req · ${tokens} tok · ${formatTimestamp(entry.updatedAt)}`;

  if (note) {
    return `${truncateText(note, NOTE_PREVIEW_LENGTH)} · ${prompt} · ${stats}`;
  }

  return `${prompt} · ${stats}`;
};

/**
 * Run picker mounted at the top of the AI Agents panel.
 *
 * Selecting a run drives the Payload Evolution tab. Reset wipes localStorage.
 * When `skipIfHosted` is set, the picker hides inside the panel host so a
 * detached "Open in New Modal" tab can still show its own copy.
 */
export const HistorySelector = ({
  skipIfHosted = false,
}: {
  skipIfHosted?: boolean;
} = {}): ReactElement | null => {
  const isHosted = useContext(HistorySelectorHostContext);
  const {
    entries,
    activeRunId,
    activeEntry,
    setActiveRunId,
    clearHistory,
    updateEntryDescription,
  } = useAiHistory();
  const selectId = `d5-dev-tool-ai-history-select-${useId()}`;
  const noteId = `d5-dev-tool-ai-history-note-${useId()}`;
  const selectedId = entries.some(entry => entry.id === activeRunId)
    ? (activeRunId ?? '')
    : (activeEntry?.id ?? '');
  const [note, setNote] = useState(activeEntry?.description ?? '');
  const [saveLabel, setSaveLabel] = useState('Save');

  useEffect(() => {
    setNote(activeEntry?.description ?? '');
    setSaveLabel('Save');
  }, [activeEntry?.id, activeEntry?.description]);

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveRunId(event.target.value || null);
  };

  const handleSaveNote = () => {
    if (!activeEntry) {
      return;
    }

    updateEntryDescription(activeEntry.id, note);
    setSaveLabel('Saved');
    window.setTimeout(() => setSaveLabel('Save'), 1500);
  };

  const handleReset = () => {
    if (!window.confirm('Clear all saved AI payload history? This cannot be undone.')) {
      return;
    }

    clearHistory();
  };

  const summary = useMemo(() => {
    if (!activeEntry) {
      return 0 === entries.length
        ? 'No saved runs yet. Open this panel before prompting so requests can be captured.'
        : `${entries.length} saved run${1 === entries.length ? '' : 's'}`;
    }

    return `${activeEntry.requestCount} request${1 === activeEntry.requestCount ? '' : 's'} · ${activeEntry.totalTokens.toLocaleString()} tokens`;
  }, [activeEntry, entries.length]);

  if (skipIfHosted && isHosted) {
    return null;
  }

  return (
    <div className="d5-dev-tool-ai-agent__history">
      <div className="d5-dev-tool-ai-agent__history-main">
        <label className="d5-dev-tool-ai-agent__history-label" htmlFor={selectId}>
          Run history
        </label>
        <select
          id={selectId}
          className="d5-dev-tool-ai-agent__history-select"
          value={selectedId}
          onChange={handleSelect}
          disabled={0 === entries.length}
        >
          {0 === entries.length ? (
            <option value="">No saved runs</option>
          ) : (
            entries.map(entry => (
              <option key={entry.id} value={entry.id}>
                {formatEntryOption(entry)}
              </option>
            ))
          )}
        </select>
        <div className="d5-dev-tool-ai-agent__history-note">
          <label className="d5-dev-tool-ai-agent__history-label" htmlFor={noteId}>
            Note
          </label>
          <div className="d5-dev-tool-ai-agent__history-note-row">
            <input
              id={noteId}
              type="text"
              className="d5-dev-tool-ai-agent__history-note-input"
              value={note}
              onChange={event => setNote(event.target.value)}
              onKeyDown={event => {
                if ('Enter' === event.key) {
                  event.preventDefault();
                  handleSaveNote();
                }
              }}
              placeholder="What was this run about?"
              disabled={!activeEntry}
            />
            <button
              type="button"
              className="d5-dev-tool-ai-agent__history-save"
              onClick={handleSaveNote}
              disabled={!activeEntry}
            >
              {saveLabel}
            </button>
          </div>
        </div>
        <p className="d5-dev-tool-ai-agent__history-summary">{summary}</p>
      </div>
      <button
        type="button"
        className="d5-dev-tool-ai-agent__history-reset"
        onClick={handleReset}
        disabled={0 === entries.length}
      >
        Reset history
      </button>
    </div>
  );
};
