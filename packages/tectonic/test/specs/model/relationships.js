'use strict';

import { assert } from 'chai';
import Model from '../../../src/model/index.js';
import relationships from '../../../src/model/relationships.js';

describe('relationships', () => {

  xit('throws an error with no relationships defined', () => {
    let model = new Model('TestModel', { id: 0 });
    assert.throws(() => relationships(model), 'Relationships must be defined');
  });

});
