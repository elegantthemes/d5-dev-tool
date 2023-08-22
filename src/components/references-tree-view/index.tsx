import React, { useEffect, useState } from 'react';
import { map, kebabCase, forEach } from 'lodash';
import { ReferencesTreeViewProps } from './types';
import './style.scss';

const ReferencesTreeView = (props: ReferencesTreeViewProps) => {
  const { data } = props;

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(data);
      return;
    }

    const searchResults: Record<string, string[]> = {};

    forEach(data, (values, key) => {
      const matchingValues = values.filter((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      if (matchingValues.length > 0) {
        searchResults[key] = matchingValues;
      }
    });

    setFilteredData(searchResults);
  }, [searchTerm, data]);

  const toggleExpand = (key: string) => {
    setExpandedKeys([key]);
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
      {map(filteredData, (members, packageName) => (
        <div key={packageName} className="et-vb-divi-devtools-tree-view-item">
          <div
            onClick={() => toggleExpand(packageName)}
            className="et-vb-divi-devtools-tree-view-item-title"
          >
            {packageName}
          </div>
          {expandedKeys.includes(packageName) && (
            <ul className="et-vb-divi-devtools-tree-view-item-list">
              {map(members, (member, index) => (
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
