
'use strict';

import React, { Component } from 'react';
import User from './user.js';
import Posts from './posts.js';

export default class Base extends Component {

  render() {
    return (
      <div>
        <User />
        <Posts />
      </div>
    );
  }
}
