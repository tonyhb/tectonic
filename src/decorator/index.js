'use strict';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import deepEqual from 'deep-equal';

import Manager from '/src/manager';
import Query from '/src/query';
import {
  GET,
  CREATE,
  UPDATE,
  DELETE
} from '/src/consts';

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

      constructor(props, context) {
        super(...arguments);

        this.queries = queries || {};
        // If the queries is a function we need to evaulate it with the current
        // redux state and component props passed in to get our query object.
        if (typeof queries === 'function') {
          // remove the tectonic state from props and pass it to the query
          // function as state. all remaining props are just standard props :)
          const { state, ...props } = props;

          // !! Note: slightly complex issue. At this point we may be rendering
          // a componet with dependent data queries to be loaded with props and
          // state.
          //
          // IF we've already queried for the parent query we'll already pass
          // the props into the component during render() (via
          // manager.props(this.queries)).
          //
          // This means that resolving **won't change our props** for the
          // component: the component has props for the parent query in the
          // initial render, and resolving **doesnt change the props** therefore
          // componentWillReceiveProps will never get called and we won't
          // compute the query function to resolve the child queries. The child
          // queries will stay in UNDEFINED_PARAMS state forever. 
          //
          // To work around this we compute queries using the props from manager
          // up until this.queries doesn't change.
          //
          // TODO: Create a proper DAG or tree of dependencies for each qeury.
          // This isn't so performant.

          // Compute queries from props and state, then compute the next set of
          // props from those queries.
          let computedQueries = queries(props, state);
          let computedProps = context.manager.props(computedQueries);

          while(deepEqual(computedQueries, queries(computedProps, state)) === false) {
            computedQueries = queries(computedProps, state);
            computedProps = context.manager.props(computedQueries);
          }

          this.queries = computedQueries;
        }
      }

      static contextTypes = {
        manager: PropTypes.instanceOf(Manager)
      }

      /**
       * componentWillReceiveProps is called after new props are passed down,
       * typically from queries being resolved and data being available.
       *
       * This means that we need to potentially re-calculate the decorator query
       * function with new props. To do this we use the previous decorator query
       * evaluation to get new props from the state.
       *
       */
      componentWillReceiveProps(next) {
        if (typeof queries === 'function') {
          // TODO: optimize. We don't need to re-calculate ths function when
          // status states change.
          const { state } = next;
          // use the existing this.queries object from the previous invokation
          // to get new params, then re-invoke queries
          const props = this.context.manager.props(this.queries)

          // TODO: TEST IN UNIT TESTS
          // Now we need to compare whether queries have changed with new props;
          // if they haven't we should NEVER add and resolve lest we find
          // ourselves in an infinite loop.
          const newQueries = this.queries = queries(props, state);
          if (deepEqual(this.queries, newQueries) === false) {
            this.queries = newQueries;
            this.addAndResolveQueries();
          }
        }
      }

      componentWillMount() {
        this.addAndResolveQueries();
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

      // TODO: the delete API is pretty fucking messy. It shouldn't need an
      // instance?
      deleteModel(opts, callback) {
        this._createQuery(DELETE, opts, callback);
      }

      _createQuery(type, opts, callback) {
        // TODO: this is a somewhat hacky way of checking if we were passed
        // a model instance. Fix me?
        if (opts.constructor.instanceOf !== undefined) {
          opts = { model: opts };
        }

        const { model, params } = opts;

        // Create a new query for the given type (CREATE, UPDATE etc)
        // Resolver utils only check that the returnType matches when querying
        // for a list; this needs no returnType field.
        const query = new Query({
          params,
          callback,
          model: model.constructor,
          queryType: type,
          body: model.values(),
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
          ...manager.props(queries),
          createModel: ::this.createModel,
          updateModel: ::this.updateModel,
          deleteModel: ::this.deleteModel,
        };

        return <WrappedComponent { ...props } />
      }
    }

}
