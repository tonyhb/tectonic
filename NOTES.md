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
