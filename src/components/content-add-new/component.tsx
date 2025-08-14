// External dependencies.
import React, { ReactElement } from 'react';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

// Local dependencies.
import { ContentAddNewProps } from './types';
import './styles.scss';

// Type for our extended divi5DevToolAjax object.
interface ExtendedDivi5DevToolAjax {
  ajaxUrl: string;
  nonce: string;
  newPostUrl?: string;
  newPageUrl?: string;
}

/**
 * Content Add New component.
 *
 * Provides buttons to create new posts and pages in WordPress admin.
 */
export const ContentAddNew = ({}: ContentAddNewProps): ReactElement => {
  /**
   * Handle button click to redirect to new post/page creation.
   */
  const handleRedirect = (url: string) => {
    // Open in the top window (parent frame) to navigate away from the visual builder.
    if (window.top) {
      window.top.location.href = url;
    } else {
      window.location.href = url;
    }
  };

  return (
    <div className="content-add-new">
      <div className="content-add-new__description">
        <p>{__('Quickly create new content in WordPress admin.', 'divi-5-dev-tool')}</p>
      </div>

      <div className="content-add-new__buttons">
        <button
          type="button"
          className="content-add-new__button content-add-new__button--post"
          onClick={() => handleRedirect((window.divi5DevToolAjax as ExtendedDivi5DevToolAjax)?.newPostUrl || '/wp-admin/post-new.php')}
        >
          <span className="content-add-new__button-icon">📝</span>
          <span className="content-add-new__button-text">
            {__('Add New Post', 'divi-5-dev-tool')}
          </span>
        </button>

        <button
          type="button"
          className="content-add-new__button content-add-new__button--page"
          onClick={() => handleRedirect((window.divi5DevToolAjax as ExtendedDivi5DevToolAjax)?.newPageUrl || '/wp-admin/post-new.php?post_type=page')}
        >
          <span className="content-add-new__button-icon">📄</span>
          <span className="content-add-new__button-text">
            {__('Add New Page', 'divi-5-dev-tool')}
          </span>
        </button>
      </div>
    </div>
  );
};
