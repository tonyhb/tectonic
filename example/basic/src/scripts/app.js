'use strict';

import React from 'react';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { Manager, Loader, reducer, BaseResolver } from 'tectonic';
import fromSuperagent from 'tectonic-superagent';
import { Router, Route, hashHistory } from 'react-router';

// This is a mock driver which loads fake data for tectonic.
// You should use our built in superagent drivers or your own driver here.
import mockDriver from './mockDriver';

// Import all models we defined for tectonic
import * as models from './models';

// React components
import Base from './components/base';
import Home from './components/home';
import Posts from './components/posts';

// 1: Add the tectonic reducer to your redux store
const store = createStore(combineReducers({ tectonic: reducer }));

// 2. Instantiate a new manager with your drivers, a resolver, and the redux
//    store
const manager = new Manager({
  drivers: {
    fromMock: mockDriver,
    fromSuperagent: fromSuperagent
  },
  resolver: new BaseResolver(),
  store: store
});

// 3. Define all of your API sources within the manager's drivers
//    Note the driver names are the keys in the drivers object from step 2
manager.fromSuperagent([
  // This defines API endpoints that provide data for specific models
  {
    returns: models.User.item(), // This returns a single user
    params: ['id'], // The API endpoint needs to know the user ID - this is required
    meta: {
      url: 'http://localhost:3001/users/:id'
    }
  },
  {
    returns: models.Post.list(), // This returns a single user
    params: ['userId'], // The API endpoint needs to know the user ID - this is required
    meta: {
      url: 'http://localhost:3001/posts?userId=:userId'
    }
  }
]);

// 4. Wrap your root components with Redux' provider AND our Loader from
//    tectonic
const data = (
  <Provider store={ store }>
    <Loader manager={ manager }>
      <Router history={ hashHistory }>
        <Route component={ Base }>
          <Route path="/" component={ Home } />
          <Route path="/posts" component={ Posts } />
        </Route>
      </Router>
    </Loader>
  </Provider>
);

export default data;
