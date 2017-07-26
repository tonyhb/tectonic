'use strict';

const mock = (sourceDef, query, success, fail) => {
  const { returns } = sourceDef.meta;
  if (returns) {
    if (typeof returns === 'function') {
      // Pass the success function in as an argument to the returns function
      // defined in the mock source.
      // This allows us to delay calling success within a setTimeout, simulating
      // loading states.
      return sourceDef.meta.returns(success, query.params);
    } else {
      return success(sourceDef.meta.returns);
    }
  }

  fail('either pass success/fail state in query params or provide meta.returns');
};

export default mock;
