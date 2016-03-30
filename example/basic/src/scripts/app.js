'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { Manager, Loader, reducer, DumbResolver } from 'tectonic-redux';

// This is a mock driver which loads fake data for tectonic.
// You should use our built in superagent drivers or your own driver here.
import mockDriver from './mockDriver';

// Component
import Base from './components/base';

// 1: Add the tectonic reducer to your redux store
const store = createStore(combineReducers({ tectonic: reducer }));

// 2. Instantiate a new manager with your drivers, a resolver, and the redux
//    store
const manager = new Manager({
  drivers: {
    fromMock: mockDriver
  },
  resolver: new DumbResolver(),
  store: store
});

// 3. Wrap your root components with Redux' provider AND our Loader from
//    tectonic
const data = (
  <Provider store={ store }>
    <Loader manager={ manager }>
      <Base />
      {/* Your components, such as the Router, go here */}
    </Loader>
  </Provider>
);

export default data;
