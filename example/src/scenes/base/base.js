import React from 'react';
import css from 'react-css-modules';
import { Link } from 'react-router';
import styles from './base.css';

const UnstyledBase = ({ children }) => (
  <div>
    <div styleName="header">
      <Link to='/' className='dashboard'>Dashboard</Link>
    </div>
    { children }
  </div>
);

UnstyledBase.propTypes = {
  children: React.PropTypes.node,
};

export default css(styles)(UnstyledBase);
export { UnstyledBase };
