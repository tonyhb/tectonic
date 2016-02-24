'use strict';

import Sources from '../src/sources';
import superagent from '../src/sources/drivers/superagent';
// Import a custom mocking driver for our tests
import mock from './mockDriver';

const sources = new Sources({
  fromMock: mock,
  fromSuperagent: superagent
});

export default sources;
