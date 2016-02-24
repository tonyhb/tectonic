'use strict';

import { assert } from 'chai';
import Sources from '../../src/sources';

describe('Defining source drivers', () => {

  it('adds methods to the source class', () => {
    let called = false;

    const s = new Sources({
      test: () => called = true
    });

    assert.isFunction(s.test);
    s.test([]);
    assert.isTrue(called);
  });

  it('passes correct context arg when calling drivers', () => {
    let ctx;
    const s = new Sources({
      test: (context) => ctx = context
    });

    s.test([]);
    assert.equal(s, ctx);
  });

});
