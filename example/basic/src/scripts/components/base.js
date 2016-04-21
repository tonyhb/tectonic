
'use strict';

import React, { Component } from 'react';
import { Link } from 'react-router';
import css from 'react-css-modules';
import styles from './base.css';

const Base = ({ children }) => (
  <div>
    <div styleName='top'>
      <h1 styleName='heading'>Tectonic Demo</h1>
      <ul styleName='menu'>
        <li><Link to='/'>Home</Link></li>
        <li><Link to='/posts'>Posts</Link></li>
      </ul>
    </div>
    <div styleName='content'>
      { children }
    </div>
  </div>
);

Base.propTypes = { children: React.PropTypes.node };

export default css(styles)(Base);
