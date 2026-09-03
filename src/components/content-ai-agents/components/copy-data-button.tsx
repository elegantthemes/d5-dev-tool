// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';

// Local dependencies.
import { copyTextToClipboard } from '../utils/copy-to-clipboard';

type CopyDataButtonProps = {
  label?: string;
  getValue: () => string;
};

/**
 * Copies lazily-serialized debug data to the clipboard.
 */
export const CopyDataButton = ({
  label = 'Copy JSON',
  getValue,
}: CopyDataButtonProps): ReactElement => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const ownerDocument = event.currentTarget.ownerDocument ?? document;

    try {
      await copyTextToClipboard(getValue(), ownerDocument);
      setErrorMessage('');
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch (error) {
      const message = (error as { message?: string })?.message ?? 'Unknown clipboard error';

      setErrorMessage(message);
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  const buttonLabel = 'copied' === copyState
    ? 'Copied'
    : 'error' === copyState
      ? 'Copy failed'
      : label;

  return (
    <button
      type="button"
      className="d5-dev-tool-ai-agent__copy-button"
      onClick={handleCopy}
      title={'error' === copyState ? errorMessage : label}
    >
      {buttonLabel}
    </button>
  );
};
