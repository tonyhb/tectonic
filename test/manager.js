'use strict';

import Manager from '/src/manager';
import DumbResolver from '/src/resolver/dumbResolver.js';
import superagent from '/src/drivers/superagent';

// Import a custom mocking driver for our tests
import mock from './mockDriver';
import { User } from './models';

const resolver = new DumbResolver();

const manager = new Manager({
  drivers: {
    fromMock: mock,
    fromSuperagent: superagent
  },
  resolver
});

export default Manager;
