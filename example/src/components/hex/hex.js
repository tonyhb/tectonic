import React from 'react';
import css from 'react-css-modules';
import styles from './hex.css';

const Hex = ({ children }) => (
  <div styleName='hex'>
    <i styleName='icon' />
    <span>{ children }</span>
  </div>
);

Hex.propTypes = {
  children: React.PropTypes.node.isRequired,
};

export default css(styles)(Hex);
