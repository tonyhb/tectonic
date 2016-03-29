'use strict';

import { assert } from 'chai';
import sinon from 'sinon';
// src
import DumbResolver from '/src/resolver/dumbResolver.js';
import Query from '/src/query';
import SourceDefinition from '/src/sources/definition.js';
import Returns, {
  RETURNS_ITEM,
  RETURNS_ALL_FIELDS
} from '/src/sources/returns.js';

// test
import { User, Post } from '/test/models.js';
import { createNewManager } from '/test/manager.js';

describe('dumbResolver', () => {

  describe('definitionsByModel', () => {
    it('adds a single sourceDefinition return to definitionsByModel', () => {
      const r = new DumbResolver();
      const def = new SourceDefinition({
        id: 'somedef',
        returns: User.item(),
        meta: {}
      });
      r.onAddDefinition(def);

      const { definitionsByModel: defs } = r;

      assert.isDefined(defs);
      assert.equal(defs.size, 1);
      const userDefs = defs.get(User);
      assert.equal(userDefs.length, 1);
      assert.equal(userDefs[0], def.id);
    });

    it('adds multiple sourceDefinitions to definitionsByModel', () => {
      const r = new DumbResolver();
      const def = new SourceDefinition({
        id: 'somedef',
        returns: {
          user: User.item(),
          list: Post.list()
        },
        meta: {}
      });
      r.onAddDefinition(def);

      const { definitionsByModel: defs } = r;
      // ensure it has one entry - User
      assert.equal(defs.size, 2);

      const userDefs = defs.get(User);
      assert.equal(userDefs.length, 1);
      assert.equal(userDefs[0], def.id);

      const postDefs = defs.get(Post);
      assert.equal(postDefs.length, 1);
      assert.equal(postDefs[0], def.id);
    });
  });

  it('adds queries to unresolvedQueries', () => {
    const query = User.getItem({ id: 1 });
    const r = new DumbResolver();

    r.addQuery(query);
    assert.equal(r.unresolvedQueries.length, 1);
    assert.equal(r.unresolvedQueries[0], query);
  });

  describe('resolving', () => {
    describe('unresolvable queries', () => {
      const query = User.getItem({ id: 1 });

      it('warns when resolving unresolvable queries', () => {
        const resolver = new DumbResolver();
        const manager = createNewManager(resolver);
        // housekeeping so you see what up with the below tests
        assert.equal(resolver, manager.resolver);

        resolver.addQuery(query, manager.sources);

        let mock = sinon.mock(console);
        mock.expects('warn');
        resolver.resolve();
        mock.verify();
        mock.restore();
      });

      it('keeps unresolvable queries in resolver.unresolvedQueries', () => {
        const resolver = new DumbResolver();
        const manager = createNewManager(resolver);
        resolver.addQuery(query, manager.sources);

        assert.equal(resolver.unresolvedQueries.length, 1);
        resolver.resolve();
        assert.equal(resolver.unresolvedQueries.length, 1);
      });
    });

    // NOTE: This is heavily dependent on the manager API to tie things together
    // nicely.
    describe('resolvable queries', () => {

      const setupManager = () => {
        const resolver = new DumbResolver();
        const manager = createNewManager(resolver);
        manager.fromMock([
          {
            id: 'somedef',
            meta: {},
            returns: User.item()
          }
        ]);
        // Ensure that the source is set within sources
        assert.isDefined(manager.sources.definitions.get('somedef'));
        assert.isDefined(manager.sources.definitions.get('somedef').driverFunc);
        // Queries are modified during each call to resolve(), therefore we
        // should create a new query for each test.
        const query = User.getItem({ id: 1 });
        manager.addQuery(query);
        return [manager, query];
      };

      it('adds resolved queries to this.resolvedQueries', () => {
        const [manager, _] = setupManager();
        assert.equal(manager.resolver.unresolvedQueries.length, 1);
        assert.equal(manager.resolver.resolvedQueries.length, 0);
        manager.resolve();
        assert.equal(manager.resolver.unresolvedQueries.length, 0);
        assert.equal(manager.resolver.resolvedQueries.length, 1);
      });

      it('stores the source definition within the query', () => {
        const [manager, query] = setupManager();
        assert.isUndefined(query.sourceDefinition);
        manager.resolve();
        assert.equal(query.sourceDefinition, manager.sources.definitions.get('somedef'));
      });

      it(`calls the SourceDefinition's driver when resolving`, () => {
        const [manager, query] = setupManager();
        const sourceDef = manager.sources.definitions.get('somedef');

        // Stub the driver function withou our source definition
        const stub = sinon.stub(sourceDef, 'driverFunc');
        manager.resolve();
        assert.isTrue(stub.called);
      });

      xit(`stores data`, () => {
      });
    });

  });

});
