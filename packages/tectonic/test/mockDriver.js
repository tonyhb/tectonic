'use strict';

const mock = (sourceDef, query, success, fail) => {
  // If query params say fail fail hard and fast
  if (query.params.fail === true) {
    return fail(query.params.failWith);
  }

  if (query.params.success === true) {
    return success(query.params.successWith);
  }

  const { returns } = sourceDef.meta;

  if (returns) {
    if (typeof returns === 'function') {
      // Pass the success function in as an argument to the returns function
      // defined in the mock source.
      // This allows us to delay calling success within a setTimeout, simulating
      // loading states.
      return sourceDef.meta.returns(success);
    } else {
      return success(sourceDef.meta.returns);
    }
  }

  fail('either pass success/fail state in query params or provide meta.returns');
};

export default mock;
