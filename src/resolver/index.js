'use strict';

// For each request in all component queries we need to list all sources which
// satisfy the query
//
// We then iterate through each query and dedupe using the following strategy:
//
// 1. If a query is satisfiable by ONLY ONE source we MUST include it
// 2. If a query is satsifiable by MANY sources including those in step #1 mark
//    it as satisfied
// 3. If a query is satisfiable by MANY sources excluding those in step #1 LIST
//    ALL potential sources in a map. The value of the map should be the number
//    of times the source is referenced.
// 4. Iterate through all listed sources in order of most frequently used to
//    least, culling each query that it satisfies then recalculating the list of
//    sources for unsatisfied queries.
