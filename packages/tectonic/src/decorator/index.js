// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import d from 'debug';

import Manager from '../manager';
import Query from '../query';
import PropInspector from './propInspector';
import {
  GET,
  CREATE,
  UPDATE,
  DELETE,
} from '../consts';

import type { QueryOpts } from '../query/index';

const debug = d('tectonic:decorator');

/**
 * Load is our decorator which accepts an object of queries or a function which
 * takes (state, params) as arguments and returns an object of queries.
 *
 */
export default function load(loadQueries: { [key: string]: Query } | Function = {}) {
  // TODO:
  // 3. Call the thunk with store.getState() and this.props
  // 4. Take result of thunk and transform into an array (if it's not already)
  // 5. Iterate through array and figure out how to call and load data

  return (WrappedComponent: Class<React$Component<*, *, *>>) => {
    class TectonicComponent extends Component {
      static WrappedComponent = WrappedComponent

      static propTypes = {
        // State is all redux state
        state: React.PropTypes.instanceOf(Map),
      }

      static contextTypes = {
        manager: React.PropTypes.instanceOf(Manager),
      }

      /**
       * Each component stores its resolved queries from each render. This
       * allows us to check whether queries have changed when the component
       * receives new props; if they change we need to enqueue the new queries
       * to load new data.
       *
       */
      // eslint-disable-next-line react/sort-comp
      queries: { [key: string]: Query } = {}
      inspector: PropInspector

      constructor(...args) {
        super(...args);
        const { manager } = this.context;

        // TODO: Test that adding .success to this.queries doesn't affect the
        // constructor queries

        // If the queries is a function we need to evaulate it with the current
        // redux state and component props passed in to get our query object.
        if (typeof loadQueries === 'function') {
          this.inspector = new PropInspector({ queryFunc: loadQueries });

          // remove the tectonic state from props and pass it to the query
          // function as state. all remaining props are just standard props :)
          const { ...props } = this.props;
          delete props.state;
          this.queries = this.inspector.computeDependencies(props, manager, manager.store.getState());
        } else {
          this.queries = loadQueries;
          // These are static queries, but the component may have already been
          // rendered in a prior app path. This means that we're going to need
          // to iterate through all queries and reset .status to undefined, so
          // that we guarantee we don't skip the cache and respect cache control
          Object.keys(this.queries).forEach((q) => {
            // TODO: Potential clone() method inside query which allows us to
            // clone a query based on constructor args - instead of this reset
            this.queries[q].status = undefined;
            this.queries[q].returnedIds = new Set();
          });
        }
      }

      componentWillMount() {
        this.addAndResolveQueries();
      }

      /**
       * componentWillReceiveProps is called after new props are passed down to
       * our component.
       *
       * We only need to re-calculate our queries if the props passed down are
       * different from those that were passed in the constructor.
       *
       * And even then, we should only re-resolve queries that have changed.
       *
       */
      componentWillReceiveProps(next) {
        if (typeof loadQueries === 'function' && next !== undefined) {
          const { ...others } = next;
          delete others.state;

          // use the existing this.queries object from the previous invokation
          // to get new params, then re-invoke queries
          const props = {
            ...others,
            ...this.context.manager.props(this.queries),
          };

          // Generate new queries by computing dependencies with the new props
          // and state.
          const newQueries = this.inspector.computeDependencies(props, null, this.context.manager.store.getState());

          // Assign the props newQueries to this.queries; this is gonna retain
          // query statuses for successful queries and not re-query them even if
          // the cache is now invalid
          Object.keys(newQueries).forEach((q) => {
            if (this.queries[q]) {
              this.queries[q].params = newQueries[q].params;
            } else {
              this.queries[q] = newQueries[q];
            }
          });

          debug('computed new queries for component', this.queries);

          this.addAndResolveQueries();
        }
      }

      componetWillUnmount() {
        this.queries = {};
      }

      addAndResolveQueries() {
        const {
          queries,
          context: { manager },
        } = this;

        const queryKeys = Object.keys(queries);

        if (queryKeys.length === 0) {
          return;
        }

        debug('adding queries to resolver', queries);

        // Resolve the queries and load the data.
        queryKeys.forEach((q) => {
          manager.addQuery(queries[q]);
        });

        manager.resolve();
      }

      createModel = (opts, callback) => {
        this.query({ ...opts, queryType: CREATE }, callback);
      }

      updateModel = (opts, callback) => {
        this.query({ ...opts, queryType: UPDATE }, callback);
      }

      deleteModel = (opts, callback) => {
        this.query({ ...opts, queryType: DELETE }, callback);
      }

      getModel = (opts, callback) => {
        this.query({ ...opts, queryType: GET }, callback);
      }

      query = (opts: QueryOpts, callback) => {
        const { queryType, model } = opts;

        if (model === undefined) {
          throw new Error('The \'model\' key must be defined when making a query');
        }

        if ([GET, CREATE, UPDATE, DELETE].indexOf(queryType) === -1) {
          throw new Error(`queryType must be one of ${CREATE}, ${UPDATE}, ${DELETE}`);
        }

        if ([UPDATE, DELETE].indexOf(queryType) >= 0 && opts.modelId === undefined) {
          throw new Error(`The 'modelId' key must be set for ${UPDATE} or ${DELETE} queries`);
        }

        if (queryType === CREATE && opts.body === undefined) {
          throw new Error(`The 'body' key must be set for ${CREATE} queries`);
        }

        // Create a new query for the given type (CREATE, UPDATE etc)
        // Resolver utils only check that the returnType matches when querying
        // for a list; this needs no returnType field.
        const query = new Query({ ...opts, callback });

        const {
          context: { manager },
        } = this;

        // TODO: keep track of query in load component for future devtools?
        manager.addQuery(query);
        manager.resolve();
      }

      /**
       * load allows us to automatically add and resolve queries generated by
       * models, such as `getItem` or `getList`.
       *
       * this.props.load({
       *   propName: User.getItem({ id: 1 })
       * });
       */
      load = (queries) => {
        if (typeof queries !== 'object') {
          throw new Error(`Load argument must be an object (ie.
this.props.load({
  propName: Model.getItem({ id: 1 })
})`);
        }

        Object.keys(queries).forEach((q) => {
          // ensure this query is forced to resolve each time.
          // See the Query definition's force property for more info.
          queries[q].force();
          // Update this.queries in this decorator so that render()
          // automatically injects our properties.
          this.queries[q] = queries[q];
          this.queries[q].status = undefined;
          this.queries[q].returnedIds = new Set();
        });

        this.addAndResolveQueries();
      }

      render() {
        const {
          queries,
          context: { manager },
        } = this;

        const props = {
          ...this.props,
          ...manager.props(queries),
          getModel: this.getModel,
          createModel: this.createModel,
          updateModel: this.updateModel,
          deleteModel: this.deleteModel,
          query: this.query,
          load: this.load,
        };

        return <WrappedComponent { ...props } />;
      }
    }

    return connect(state => ({ state: state.tectonic }))(TectonicComponent);
  };
}
