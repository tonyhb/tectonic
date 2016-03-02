'use strict';

import LoadManager from '../src/loadManager.js';
import Sources from '../src/sources';
import DumbResolver from '../src/resolver/dumbResolver.js';
import superagent from '../src/sources/drivers/superagent';

// Import a custom mocking driver for our tests
import mock from './mockDriver';

const sources = new Sources({
  fromMock: mock,
  fromSuperagent: superagent
});

const resolver = new DumbResolver();

const loadManager = new LoadManager({ sources, resolver });

export default loadManager;
export {
  sources
};
