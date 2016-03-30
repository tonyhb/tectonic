'use strict';

const mock = (sourceDef, query, success, fail) => {
  // If query params say fail fail hard and fast
  if (query.params.fail === true) {
    fail(query.params.failWith);
  }

  if (query.params.success === true) {
    success(query.params.successWith);
  }

  if (sourceDef.meta.returns) {
    success(sourceDef.meta.returns);
  }

  fail('either pass success/fail state in query params or provide meta.returns');
};

export default mock;
