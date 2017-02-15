import React from 'react';
import css from 'react-css-modules';
import styles from './header.css';

const Header = ({ children }) => (
  <div styleName='header'>
    { children }
  </div>
);

Header.propTypes = {
  children: React.PropTypes.node.isRequired,
};

export default css(styles)(Header);
