'use strict';

import { assert } from 'chai';
import Sources from '../../src/sources';

describe('Defining source drivers', () => {

  it('adds methods to the source class', () => {
    const s = new Sources({
      test: () => ({})
    });
    assert.isFunction(s.test);
  });

  xit('calls the driver method with then, fail, params and source', () => {
    // TODO Ensure that drivers are called correctly when asked to load a model
  });

});
