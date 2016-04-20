'use strict';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Manager from '/src/manager';
import Query from '/src/query';
import {
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
          this.queries = queries(props, state);
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
          this.queries = queries(props, state);
          this.addAndResolveQueries();
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
       * a CREATEA query and adds it to the resolver.
       *
       * @param Model instantiated model with data added
       * @param function async-style callback with params (err, response)
       */
      createModel(model, callback) {
        // Add a query to the resolver which
        // TODO: finish
        const q = new Query({
          model: model.constructor,
          queryType: CREATE,
          body: model.values()
        });

      }

      render() {
        const {
          queries,
          context: { manager }
        } = this;

        const props = {
          ...this.props,
          ...manager.props(queries)
        };

        return <WrappedComponent { ...props } />
      }
    }

}
