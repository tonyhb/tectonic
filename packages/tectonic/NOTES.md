## Query hashing:

* Queries should be hashed by their params and the source ID:
  If query A and B both use the same source and params,
  We should make one call to the source (given an advanced resolver),
  And we should report the same status for query A and B.

  Alternatively:

  If a source definition returns multiple models,
  and the cache is set up to expire model A after B,
  query for B might be resolved with the same params as A,
  but query A might need to be recalled

## Query caching

We're storing everything by ID, which is okay.

Say, though, that you query an API for your blogs settings. This has no ID,
it's raw data. How do we model that? (set the id field to one of your returned
fields?)

Say you query for a range of blog posts (or a user's posts). Or say you query
for a user by their email, not ID (an API endpoint supports this). How do we
know which IDs to search for once we load the data?

To do this we:
- Store which IDs the query returns in the cache after the call has been made
- Look up the query within this cache when asking for props
- Look up all model data from the query's ID list

This lets us query for arbitrary keys and also preserves the API ordering.

We can also:
- Inspect the query parameters of the query call
  - If the query parameter matches an ID pre-empt the API call and look in the
	cache

## Default parametrs

**Challenge**: Queries with and without default parameters should use caching
equally.

From here on out the term "user-generated query" refers to a query with a
subset of parameters filled _without_ default parameters added. The "
supplemented query" refers to a query with a subset of parameters filled _with_
default parameters added.

Problem story:

1. Queries are cached by their `.toString()` value as the lookup key.  
2. To determine whether a query can be pulled from the cache we use the
   `.toString()` key to look up data
3. Polluting a query with default parameters prior to saving in the cache
   will remove the ability to look up cache information for partial queries

All things said, this is purely a resolver issue: it's the resolver's job
to tie together source definitions, queries and the cache.
  
**Options**:
1. Save the user-generated query plus the supplemented query in the cache. We
   can then look up both in the cache during resolving immediately without
   any action; the resolution process will be short circuited before even
   processing sources for a query as the query's toString value will be in the
   cache.

2. Run the resolver as per usual, looking up the user-generated query in the
   cache. This won't be hit, as it has no default params.
   Once a source definition is found, fill in the defaults to create a
   supplemented query then look this query up in the cache.
   If so, then short circuit.  This splits the cache lookup into two separate
   places in the code.

   Only store the supplemented query in the cache.

   Pros: matches all variations of user-defined queries without defaults
