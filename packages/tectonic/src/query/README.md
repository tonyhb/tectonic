# Query

A query instance represents a single request for data to tectonic.

### How do components track query statuses?

In short, we store a map of query IDs to statuses within redux.

The flow:

1. Each query gets an ID when created within @load
2. The resolver starts resolving and should set the status for unresolved
   queries to 'PENDING'
3. Once the resolver resolves a query to a source definition the definition's
   driver is called.
4. The driver makes its request and calls the success/fail functions passed to
   it (which call resolver functions)
5. These functions then update query ID within the redux store to set the status
