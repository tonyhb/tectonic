import { assert } from 'chai';

import Cache from '../../../src/cache';
import SourceDefinition from '../../../src/sources/definition';
import Provider from '../../../src/sources/provider';
import Query from '../../../src/query';
import { UPDATE } from '../../../src/consts';
// test utils
import { User } from '../../models';
import { createStore } from '../../manager';

describe('storeQuery', () => {
  const store = createStore();
  const cache = new Cache(store);

  it("saves a query's status when there is no apiResponse", () => {
    const query = new Query({
      model: User,
      modelId: 1,
      body: {
        name: 'foo',
      },
      queryType: UPDATE,
    });
    const sd = new SourceDefinition({
      id: 'foo',
      meta: {},
      queryType: UPDATE,
      returns: User.item(),
    });

    // store a query with no API response
    cache.storeQuery(query, sd);
    assert.deepEqual(store.getState().tectonic.getIn(['status', query.toString()]), { status: 'SUCCESS' });
  });
});
