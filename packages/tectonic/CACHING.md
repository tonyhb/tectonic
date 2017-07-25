# Caching

We respect server-side cache control headers in order to implement caching of
query responses.

If the server replies with `cache-control` headers or `expires` headers, the
query will be saved with an expiry date generated from these headers. Otherwise,
the query will be saved with the current time *plus one second* as its expiry
date.

## How caching works

In short:

- Expiry dates are determined from cache control headers and default to now
  + 1 second
- Expiry dates are saved for each query and model
- The expiry date is only checked in the resolver when determining whether to
  skip a query.
- If a query is new or expired, the query is resolved in baseResolver and the
  status is set to pending
- If a query has cached data the query is skipped in the resolver


### Querying and storing

1. The resolver inspects and parses response headers from successful queries
2. The response data and expiry time are passed to the cache in `storeQuery`
3. The cache stores:
    - Expiry date and IDs for each query in queryToIds as an object: `{ ids:
      [...], expires: new Date() }`
    - Expiry date and data for each model in `data` as an object: `{ data: ...,
      expires: new Date() }

### Resolving and validating cache

1. The decorator resolves queries into a tree of dependencies when the component
   is created
2. When a query is resolved and is successful we attempt to resolve its children

### Custom caching

From tectonic 2.1 it's possible to set custom cache information for your models
and sources.  This allows you to minimize network requests and ensure that
queries will be resolved from the cache.

Custom cache information can be set on a source definition or model.  If the
cache sees that one of these is set, the cache TTL will be modified
accordingly.  If both are set the lowest value will be used.

The cache property is always an integer representing the number of seconds to
cache.

#### Model caching

Setting the `static cacheFor` property in a model ensures that all models of
this type will be cached for the given number of seconds across all source
definitions.

Note that if a source definition specifies a lower cacheFor TTL, the lower
value from the source definition will be used.

#### Source definition caching

Source definition caching allows you to specificy custom cache durations for
each API endpoint.  This gives you custom granularity on a per-url basis for
how long we should cache your data.
