'use strict';

export default function mock(ctx, sources = []) {
  return sources.map(s => {
    console.log(s);
  });
}
