import React, { useEffect, useState } from 'react';
import Fuse from 'fuse.js';
import { map, kebabCase, keys, toPairs } from 'lodash';
import { ReferencesTreeViewProps } from './types';
import './styles.scss';

/**
 * Renders a tree view of the references.
 *
 * @param {ReferencesTreeViewProps} props - Component props.
 * @returns JSX.Element
 */
const ReferencesTreeView = (props: ReferencesTreeViewProps) => {
  const { data } = props;

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(data);
      setExpandedKeys([]);
      return;
    }

    // Transform data for fuse.js: Create a flat list of { packageName, member }
    const flattenedData = toPairs(data).flatMap(([packageName, members]) => {
      return members.map(member => ({ packageName, member }));
    });

    // Initialize fuse.js
    const fuse = new Fuse(flattenedData, {
      keys: ['member'],
      threshold: 0.2,
    });

    // Search
    const searchResultsArray = fuse.search(searchTerm);

    // Transform search results into a tree-like structure for rendering
    const searchResults = searchResultsArray.reduce<Record<string, string[]>>((accumulator, current) => {
      const { packageName, member } = current.item;
      if (!accumulator[packageName]) {
        accumulator[packageName] = [];
      }
      accumulator[packageName].push(member);
      return accumulator;
    }, {});

    setExpandedKeys(keys(searchResults));

    setFilteredData(searchResults);
  }, [searchTerm, data]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prevKeys => {
      if (prevKeys.includes(key)) {
        return prevKeys.filter(existingKey => existingKey !== key);
      } else {
        return [...prevKeys, key];
      }
    });
  };

  const generateDocURL = (packageName: string, memberName: string) => {
    const baseUrl = 'https://devalpha.elegantthemes.com/docs/builder-api/js';

    const kebabMemberName = kebabCase(memberName);
    const kebabPackageName = kebabCase(packageName);

    if (kebabMemberName === kebabPackageName) {
      return `${baseUrl}/${kebabPackageName}`;
    }

    return `${baseUrl}/${kebabPackageName}/${kebabMemberName}`;
  };

  return (
    <div className="et-vb-divi-devtools-tree-view">
      <input
        type="text"
        placeholder="Search..."
        className="et-vb-divi-devtools-tree-view-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="et-vb-divi-devtools-tree-view-warning">
        Some functions lack documentation; we're addressing this.
      </div>
      {map(keys(filteredData).sort(), (packageName) => (
        <div key={packageName} className="et-vb-divi-devtools-tree-view-item">
          <div
            onClick={() => toggleExpand(packageName)}
            className="et-vb-divi-devtools-tree-view-item-title"
          >
            {packageName}
          </div>
          {expandedKeys.includes(packageName) && (
            <ul className="et-vb-divi-devtools-tree-view-item-list">
              {map(filteredData[packageName].sort(), (member, index) => (
                <li key={index}>
                  <a href={generateDocURL(packageName, member)} target="_blank">
                    {member}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export {
  ReferencesTreeView
};
