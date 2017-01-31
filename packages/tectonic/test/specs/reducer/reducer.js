import { assert } from 'chai';

import { Map } from 'immutable';
import Model from '../../../src/model';
import { User, Post } from '../../models';
import reducer, {
  UPDATE_DATA,
  DELETE_DATA,
} from '../../../src/reducer';

describe('reducer', () => {

  describe('UPDATE_DATA', () => {
    const now = new Date();
    const query = User.getItem({ id: 1 });
    query.returnedIds = [1];
    const data = {
      'users': {
        '1': {
          data: {
            name: 'foo',
          },
          cache: {
            expires: now,
          },
        },
      },
    };

    it('updates data in `data` map', () => {
      const state = reducer(undefined, {
        type: UPDATE_DATA,
        payload: {
          data,
          query,
          expires: now,
        },
      });
      assert.deepEqual(state.get('data').toJS(), data);
    });

    it('unsets any previously set deleted fields in fetched models', () => {
      // First set data
      let state = reducer(undefined, {
        type: UPDATE_DATA,
        payload: {
          data,
          query,
          expires: now,
        },
      });
      // Then delete it
      state = reducer(state, {
        type: DELETE_DATA,
        payload: {
          modelName: 'users',
          modelId: '1',
          query
        },
      });
      assert.equal(state.getIn(['data', 'users', '1', 'deleted']), true);
      console.log(state.get('data'));

      // Then reset data ia UPDATE_DATA
      state = reducer(undefined, {
        type: UPDATE_DATA,
        payload: {
          data,
          query,
          expires: now,
        },
      });

      assert.deepEqual(state.get('data').toJS(), data);
      assert.equal(!!state.getIn(['data', 'users', '1', 'deleted']), false);
      console.log(state.get('data'));
    });
  });

  describe('DELETE_DATA', () => {
    xit('marks data as deleted in `data` map', () => {
    });
  });

  describe('UPDATE_QUERY_STATUSES', () => {
    xit('merges in status for query', () => {
    });
  });

});
