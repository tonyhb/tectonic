import React from 'react';
import Scan from '../../../models/scan.js';
import Tag from '../../../components/tag/tag.js';
import AddTag from './addTag.js';

const TagList = ({ scan }) => (
  <div>
    { scan.tags.map(t => <Tag key={ t } tag={ t } deletable />) }
    <AddTag scan={ scan } />
  </div>
);

TagList.propTypes = {
  scan: React.PropTypes.instanceOf(Scan),
};

export default TagList;
