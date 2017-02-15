import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Match } from 'react-router';
import {
  Loader,
} from 'tectonic';

import store from './store';
import manager from './manager';

import Base from './scenes/base/base.js';
import Dashboard from './scenes/dashboard/dashboard.js';
import Page from './scenes/page/page.js';
import Site from './scenes/site/site.js';

const App = () => (
  <Provider store={ store }>
    <Loader manager={ manager }>
      <BrowserRouter>
        <Base>
          <Match exactly pattern='/' component={ Dashboard } />
          <Match exactly pattern='/sites/:domain' component={ Site } />
          <Match pattern='/sites/:domain/pages/:pageId' component={ Page } />
        </Base>
      </BrowserRouter>
    </Loader>
  </Provider>
);

export default App;
