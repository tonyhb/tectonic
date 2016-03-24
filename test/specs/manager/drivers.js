'use strict';

import { assert } from 'chai';
import Manager from '/src/manager';

describe('Defining source drivers', () => {

  it('adds methods to the manager class', () => {
    console.log('yea');
    const m = new Manager({
      drivers: {
        test: () => ({})
      },
      // resolver must be defined
      resolver: () => ({})
    });
    assert.isFunction(m.test);
  });

  xit('delegates to Sources.processDefinitions', () => {
    // This ensures we use validation baked into Sources
  });

});
