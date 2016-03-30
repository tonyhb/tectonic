'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { Manager, Loader, reducer, DumbResolver } from 'tectonic-redux';

// This is a mock driver which loads fake data for tectonic.
// You should use our built in superagent drivers or your own driver here.
import mockDriver from './mockDriver';

// Import all models we defined for tectonic
import * as models from './models';

// React components
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

// 3. Define all of your API sources within the manager's drivers
//    Note the driver names are the keys in the drivers object from step 2
manager.fromMock([
  // This defines API endpoints that provide data for specific models
  {
    returns: models.User.item(), // This returns a single user
    params: ['id'], // The API endpoint needs to know the user ID - this is required
    meta: {
      // meta is where we add driver-specific information such as the URL to
      // call.
      returns: (query, success, fail) => {
        // Pretend to wait for 1 second while loading the data
        window.setTimeout(
          () => success({
            id: 1,
            name: 'test',
            email: 'test@foo.com'
          }),
          1000
        );
      }
    }
  }
]);

// 4. Wrap your root components with Redux' provider AND our Loader from
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
