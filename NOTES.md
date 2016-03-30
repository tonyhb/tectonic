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
