'use strict';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import deepEqual from 'deep-equal';

import Manager from '/src/manager';
import Query from '/src/query';
import PropInspector from './propInspector.js';
import {
  GET,
  CREATE,
  UPDATE,
  DELETE
} from '/src/consts';
import Model from '/src/model';

import d from 'debug';
const debug = d('tectonic:decorator');

/**
 * Load is our decorator which accepts an object of queries or a function which
 * takes (state, params) as arguments and returns an object of queries.
 *
 */
export default function load(queries) {
  // TODO: 
  // 3. Call the thunk with store.getState() and this.props
  // 4. Take result of thunk and transform into an array (if it's not already)
  // 5. Iterate through array and figure out how to call and load data

  return (WrappedComponent) =>

    @connect((state) => ({ state }))
    class TectonicComponent extends Component {

      /**
       * Each component stores its resolved queries from each render. This
       * allows us to check whether queries have changed when the component
       * receives new props; if they change we need to enqueue the new queries
       * to load new data.
       *
       */
      queries = {}

      constructor() {
        super(...arguments);

        // TODO: Test that adding .success to this.queries doesn't affect the
        // constructor queries
        this.queries = queries || {};

        // If the queries is a function we need to evaulate it with the current
        // redux state and component props passed in to get our query object.
        if (typeof queries === 'function') {
          // remove the tectonic state from props and pass it to the query
          // function as state. all remaining props are just standard props :)
          let { state, ...props } = this.props;

          this.inspector = new PropInspector({ queryFunc: queries });
          this.queries = this.inspector.computeDependencies(props, this.context.manager);
        } else {
          // These are static queries, but the component may have already been
          // rendered in a prior app path. This means that we're going to need
          // to iterate through all queries and reset .status to undefined, so
          // that we guarantee we don't skip the cache and respect cache control
          Object.keys(this.queries).forEach(q => {
            // TODO: Potential clone() method inside query which allows us to
            // clone a query based on constructor args - instead of this reset
            this.queries[q].status = undefined;
            this.queries[q].returnedIds = new Set();
          });
        }
      }

      static contextTypes = {
        manager: PropTypes.instanceOf(Manager)
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
        if (typeof queries === 'function' && next !== undefined) {
          const { state, ...others } = next;

          // use the existing this.queries object from the previous invokation
          // to get new params, then re-invoke queries
          const props = {
            ...others,
            ...this.context.manager.props(this.queries),
          };

          // Generate new queries by computing dependencies with the new props
          // and state.
          const newQueries = this.inspector.computeDependencies(props);

          // Assign the props newQueries to this.queries; this is gonna retain
          // query statuses for successful queries and not re-query them even if
          // the cache is now invalid
          Object.keys(newQueries).forEach(q => {
            this.queries[q].params = newQueries[q].params;
          });

          debug('computed new queries for component', queries);

          this.addAndResolveQueries();
        }
      }

      componentWillMount() {
        this.addAndResolveQueries();
      }

      componetWillUnmount() {
        this.queries = {};
      }

      addAndResolveQueries() {
        const {
          queries,
          context: { manager }
        } = this;

        const queryKeys = Object.keys(queries);

        if (queryKeys.length === 0) {
          return;
        }

        debug('adding queries to resolver', queries);

        // Resolve the queries and load the data.
        queryKeys.forEach(q => {
          manager.addQuery(queries[q]);
        });

        setTimeout(() => manager.resolve(), 5);
      }

      /**
       * createModel is a function passed to the wrapped component. This
       * function takes an instance of a model and an optional callback, creates
       * a CREATE query and adds it to the resolver.
       *
       * Examples:
       *
       *   No API params or callback:
       *
       *   onSubmit(data) {
       *     this.props.createModel(new User(data));
       *   }
       *
       *   No API params, with callback:
       *
       *   onSubmit(data) {
       *     this.props.createModel(new User(data), (err, result) => {});
       *   }
       *
       *   API params, no callback:
       *
       *   onSubmit(data) {
       *     this.props.createModel({
       *       model: new Post(data)
       *       params: { userID: 1 }
       *     });
       *   }
       *
       *   API params and callback:
       *
       *   onSubmit(data) {
       *     this.props.createModel(
       *       {
       *         model: new Post(data)
       *         params: { userID: 1 }
       *       },
       *       (err, result) => {}
       *     );
       *   }
       *
       * @param Object containing model instance with data to save and any api
       * params
       * @param function async-style callback with params (err, response)
       */
      createModel(opts, callback) {
        this._createQuery(CREATE, opts, callback);
      }

      updateModel(opts, callback) {
        this._createQuery(UPDATE, opts, callback);
      }

      // deleteModel creates a DELETE query for a model instance.
      // It can be used in the following ways:
      //
      // Note that opts.modelId may be specified to
      deleteModel(opts, callback) {
        this._createQuery(DELETE, opts, callback);
        /*
         * TODO api cleanup later, see API.md
        if (typeof opts === 'function' && callback === undefined) {
          // deleteModel was called like so:
          // this.props.deleteModel(this.props.user, callback)
          callback = opts;
          opts = {};
        }

        if (typeof model.values === 'function') {
          opts
        } 
        */
      }

      getModel(opts, callback) {
        this._createQuery(GET, opts, callback);
      }

      _createQuery(type, opts = {}, callback) {
        if (opts instanceof Model) {
          opts = { model: opts };
        }

        // If we pass a model class as opts.model, 
        if (typeof opts.model.values !== 'function') {
          // Quick hack to make things work - below expects an instance of the
          // model
          opts.model = new opts.model();
        }

        if (opts.modelId === undefined) {
          // TODO can we get this from params if not defined here?
          opts.modelId = opts.model[opts.model.constructor.idField]; // TODO: test
        }

        const { model, params, modelId } = opts;

        // Create a new query for the given type (CREATE, UPDATE etc)
        // Resolver utils only check that the returnType matches when querying
        // for a list; this needs no returnType field.
        const query = new Query({
          modelId,
          params,
          callback,
          model: model.constructor,
          queryType: type,
          body: model.values && model.values(),
        });

        const {
          context: { manager }
        } = this;

        // TODO: keep track of query in load component for future devtools?
        manager.addQuery(query);
        manager.resolve();
      }

      render() {
        const {
          queries,
          context: { manager }
        } = this;

        const props = {
          ...this.props,
          ...manager.props(queries, undefined, true),
          getModel: ::this.getModel,
          createModel: ::this.createModel,
          updateModel: ::this.updateModel,
          deleteModel: ::this.deleteModel,
        };

        return <WrappedComponent { ...props } />
      }
    }

}
