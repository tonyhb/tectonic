'use strict';

import Manager from '/src/manager';
import DumbResolver from '/src/resolver/dumbResolver.js';
import superagent from '/src/drivers/superagent';
import reducer from '/src/reducer';

// Import a custom mocking driver for our tests
import mock from './mockDriver';
import { User } from './models';
import { createStore as reduxCreateStore, combineReducers } from 'redux';

export const createStore = () => {
  return reduxCreateStore(combineReducers({
    tectonic: reducer
  }));
}

// createNewManager creates a completely fresh instance of a manager using the
// DumbResolver by default
export const createNewManager = (resolver = new DumbResolver()) => {
  const store = reduxCreateStore(combineReducers({
    tectonic: reducer
  }));

  const manager = new Manager({
    drivers: {
      fromMock: mock,
      fromSuperagent: superagent
    },
    store,
    resolver
  });

  return manager;
}

// By default export an instantiated manager version
export default createNewManager();
