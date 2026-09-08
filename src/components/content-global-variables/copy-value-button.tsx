// External dependencies.
import React, {
  ReactElement,
  useState,
} from 'react';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { copyTextToClipboard } from '../content-ai-agents/utils/copy-to-clipboard';

type CopyValueButtonProps = {
  getValue: () => string;
  label?: string;
  className?: string;
};

/**
 * Copies a serialized value to the clipboard.
 */
export const CopyValueButton = ({
  getValue,
  label = __('Copy', 'divi-5-dev-tool'),
  className = 'd5-dev-tool-global-variables__copy-button',
}: CopyValueButtonProps): ReactElement => {
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
    ? __('Copied', 'divi-5-dev-tool')
    : 'error' === copyState
      ? __('Copy failed', 'divi-5-dev-tool')
      : label;

  return (
    <button
      type="button"
      className={className}
      onClick={handleCopy}
      title={'error' === copyState ? errorMessage : label}
    >
      {buttonLabel}
    </button>
  );
};
