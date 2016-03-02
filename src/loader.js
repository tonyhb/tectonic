'use strict';

import React, { Component, PropTypes } from 'react';
import LoadManager from './loadManager.js';

/**
 * Loader is a top-level wrapper component which provides react context for
 * the LoadManager.
 *
 * This allows our @load wrapper to issue queries to LoadManager which then
 * resolves these queries via `resolvers`.
 */
export default class Loader extends Component {

  static propTypes = {
    loadManager: PropTypes.instanceOf(LoadManager)
  }

  static childContextTypes = {
    loadManager: PropTypes.instanceOf(LoadManager)
  }

  getChildContext() {
    return {
      loadManager: this.props.loadManager
    }
  }

  // TODO: set up context to pass down source into @load component
  render = () => this.props.children;
} 
