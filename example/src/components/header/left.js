import React from 'react';
import css from 'react-css-modules';
import styles from './header.css';

const LeftHeader = ({ children }) => (
  <div styleName='left'>
    { children }
  </div>
);

LeftHeader.propTypes = {
  children: React.PropTypes.node.isRequired,
};

export default css(styles)(LeftHeader);
