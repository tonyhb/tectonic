'use strict';

import { assert } from 'chai';
import sinon from 'sinon';

import React, { Component } from 'react';
import load from '../../../../src/decorator';
import { CREATE } from '../../../../src/consts';

import { renderAndFind } from '../../../utils';
import { createNewManager } from '../../../manager';
import { User, Post } from '../../../models';

// This spec tests creating a model from within a component.
//
// Creates are always triggered from user actions (submitting a form, clicking
// a button etc.).
//
// To do this we pass a function from the decorator into your component called
// `createModel`. This does the following:
//
// 1. Creates a new query for the resolver with a type of CREATE
// 2. Adds a custom callback to the query which will be called **with the result
//    of the API call**.
//    This lets you chain creates together using async.js
describe('props.createModel', () => {

  class Basic extends Component {
    // This can be called from our test utils. By allowing a custom
    // model and user we can change this in each test.
    create(model, callback) {
      this.props.createModel({
        body: model.values(),
        model, // model.constructor?
      }, callback);
    }
    render = () => <p>Hi</p>;
  }
  const Wrapped = load()(Basic);

  describe('@load decorator', () => {
    it('passes createModel down to the component', () => {
      const item = renderAndFind(<Wrapped />, Basic);
      assert.isFunction(item.props.createModel);
    });

    it('should pass a Query model with queryType of "CREATE" into the resolver', () => {
      const m = createNewManager();
      const stub = sinon.stub(m, 'addQuery', (query) => {
        assert.equal(query.queryType, CREATE)
      });
      const item = renderAndFind(<Wrapped />, Basic, m);
      item.create(new User({ id: 1 }));
      assert.isTrue(stub.called);
    });
  });

  describe('callback', () => {

    it('callback called with no err and a result after successfully creating', (done) => {
      const item = renderAndFind(<Wrapped />, Basic);

      let calledWith;
      // Add a callback which copies the callback args into calledWith
      item.create(
        new User({ name: 'foo', email: 'foo@bar.com' }),
        (err, result) => {
          calledWith = [err, result];
        }
      );

      // Resolving happens after 5ms
      window.setTimeout(() => {
        console.log(calledWith);
        assert.isArray(calledWith);
        done();
      }, 10);
    });

    it('callback called with err and no result after failure', (done) => {
      const item = renderAndFind(<Wrapped />, Basic);
      let calledWith;
      // There should NOT be a source defined for creating a Post model in our
      // tests
      item.create(
        new Post({ name: 'foo', email: 'foo@bar.com' }),
        (err, result) => {
          calledWith = [err, result];
        }
      );

      // Resolving happens after 5ms
      window.setTimeout(() => {
        assert.isArray(calledWith);
        const [err, result] = calledWith;
        assert.isDefined(err);
        done();
      }, 10);
    });
  });

});
