import { assert } from 'chai';
import React, { Component } from 'react';

import { renderAndFind } from '../../../utils';
import load from '../../../../src/decorator';
import { CREATE } from '../../../../src/consts';
import { User } from '../../../models';

describe('props.query', () => {

  class Basic extends Component {
    render = () => <p>Hi</p>;
  }
  const Wrapped = load()(Basic);

  it('adds invalid source definition errors to "err" in callbacks', (done) => {
    const component = renderAndFind(<Wrapped />, Basic);
    const opts = {
      queryType: CREATE,
      body: {'foo':'bar'},
      model: User,
    };

    let result;
    component.props.query(opts, (err, res) => result = [err, res]);

    window.setTimeout(() => {
      assert.isDefined(result);

      const [err, res] = result;
      assert.isDefined(err);
      assert.isNull(res);
      assert.isTrue(err === 'There is no source definition which resolves the query');
      done();
    }, 10);
  });

});
