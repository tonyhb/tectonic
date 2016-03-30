export default function(sourceDef, query, success, fail) {
  // call the 'returns' function within the meta property of the source
  // definition
  sourceDef.meta.returns(query, success, fail);
}
