'use strict';

import React, { Component, PropTypes } from 'react';
import Sources from './sources';

/**
 * Loader is a top-level wrapper component which provides react context for
 * predefined model sources.
 *
 * This allows our @load wrapper to connect to Sources and initiate requests for
 * data.
 *
 */
export default class Loader extends Component {

  static propTypes = {
    sources: PropTypes.instanceOf(Sources)
  }

  static childContextTypes = {
    sources: PropTypes.instanceOf(Sources)
  }

  getChildContext() {
    return {
      sources: this.props.sources
    }
  }

  // TODO: set up context to pass down source into @load component
  render = () => this.props.children;
} 
