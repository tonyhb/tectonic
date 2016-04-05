'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import { createNewManager } from '/test/manager.js';
import { User, Post } from '/test/models';

describe('manager resolver functionality', () => {

  it('delegates addQuery to resolver', () => {
    const m = createNewManager();
    const mock = sinon.mock(m.resolver);
    mock.expects('addQuery').once();
    m.addQuery(User.getItem());
    mock.verify();
    mock.restore();
  });

  it('delegates resolve to resolveAll', () => {
    const m = createNewManager();
    const mock = sinon.mock(m.resolver);
    mock.expects('resolveAll').once();
    m.resolve()
    mock.verify();
  });

});

