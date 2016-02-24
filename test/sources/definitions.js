'use strict';

import { assert } from 'chai';
import source from '../source';

describe('Defining source definitions', () => {

  it('throws an error when a driver accepts no parameters', () => {
    assert.throws(
      () => source.fromMock(),
      'No source definitions'
    );
  });
});
