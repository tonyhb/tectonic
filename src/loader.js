'use strict';

import React, { Component } from 'react';

export default class Loader extends Component {
  // TODO: set up context to pass down source into @load component
  render = () => this.props.children;
} 
