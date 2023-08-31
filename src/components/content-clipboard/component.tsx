// External dependencies.
import React, {
  ReactElement,
  createElement
} from 'react';
import {
  isArray,
  isObject,
  keys,
  map,
} from 'lodash';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Divi dependencies.
import { ObjectRenderer } from '@divi/object-renderer';

// Local dependencies.
import {
  ContentClipboardProps,
  ClipboardItemProps,
  ClipboardPayloadItemProps,
} from './types';
import './styles.scss';

/**
 * Component for rendering clipboard item's payload item.
 */
const PayloadItem = ({
  name,
  values,
}: ClipboardPayloadItemProps): ReactElement => (
  <div className="d5-dev-tool-clipboard-item-payload-item">
    <span className="d5-dev-tool-clipboard-item-payload-item-title">{name}</span>
    <span className="d5-dev-tool-clipboard-item-payload-item-value">
      {
        isArray(values) || isObject(values)
          ? createElement(
            ObjectRenderer, { values })
          : values
      }
    </span>
  </div>
);

/**
 * Component for rendering clipboard item.
 */
const ClipboardItem = ({
  clipboardType,
  origin,
  payload,
  itemIndex,
}: ClipboardItemProps): ReactElement => (
  <div
    className="d5-dev-tool-clipboard-item"
  >
    <div className={`d5-dev-tool-clipboard-item-type d5-dev-tool-clipboard-item-type--${clipboardType}`}>{clipboardType}</div>
    <div className="d5-dev-tool-clipboard-item-index">{`#${itemIndex}`}</div>
    <div className="d5-dev-tool-clipboard-item-origin">{origin}</div>
    <div className="d5-dev-tool-clipboard-item-payload">
      {keys(payload).map((payloadItemName) => (
        <PayloadItem
          name={payloadItemName as keyof typeof payload}
          values={payload[payloadItemName as keyof typeof payload]}
          key={`d5-dev-tool-clipboard-item-payload--${payloadItemName}`}
        />
      ))}
    </div>
  </div>
);

/**
 * Component for rendering clipboard items.
 */
export const ContentClipboard = ({
  clipboardItems
}: ContentClipboardProps): ReactElement => {

  if (!clipboardItems?.length) {
    return (
      <div className="d5-dev-tool-no-items">
        {__('No clipboard found', 'divi-5-dev-tool')}
      </div>
    );
  }

  return (
    <div className="d5-dev-tool-clipboard-items">
      {map(clipboardItems, (item, itemIndex) => (
        createElement(
          ClipboardItem, {
          clipboardType: item.clipboardType,
          origin: item.origin,
          payload: item.payload,
          key: `d5-dev-tool-clipboard-item--${itemIndex}`,
          itemIndex,
        },
        )
      ))}
    </div>
  );
};
