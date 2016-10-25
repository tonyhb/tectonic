'use strict';

import Manager from '../src/manager';
import BaseResolver from '../src/resolver/baseResolver.js';
import reducer from '../src/reducer';

// Import a custom mocking driver for our tests
import mock from './mockDriver';
import { User } from './models';
import { createStore as reduxCreateStore, combineReducers } from 'redux';

export const createStore = () => {
  return reduxCreateStore(combineReducers({
    tectonic: reducer,
    misc: (state = {}, action) => {
      if (action.type === 'MISC') {
        return action.payload;
      }
      return state;
    }
  }));
}

// createNewManager creates a completely fresh instance of a manager using the
// BaseResolver by default
export const createNewManager = (resolver = new BaseResolver()) => {
  const store = createStore();

  const manager = new Manager({
    drivers: {
      fromMock: mock
    },
    store,
    resolver
  });

  return manager;
}

// By default export an instantiated manager version
export default createNewManager();
