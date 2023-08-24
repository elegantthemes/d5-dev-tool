// Divi dependencies
import {
  withSelect,
  select,
} from '@divi/data';

// Local dependencies.
import { ContentSaved } from './component';


/**
 * Container component for ContentSaved
 */
export const ContentSavedContainer = withSelect((selectStore: typeof select) => ({
  serializedLayout: selectStore('divi/serialized-post').getState(['postContent', 'content']),
}))(ContentSaved);
