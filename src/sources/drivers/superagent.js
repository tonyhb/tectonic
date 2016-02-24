'use strict';

export default fromSuperagent = (then, fail) => (params) => (source) => {
  let call = source.meta.call();

  if (params) {
    call.query(params);
  }

  call.end((err, res) => {
    if (err) {
      return fail(err);
    }
    then(source.meta.transform(res));
  });
};
