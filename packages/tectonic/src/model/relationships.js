'use strict';

export default function relationships(model, definitions) {
  if (typeof definitions !== 'object') {
    throw new Error('Relationships must be defined');
  }

  model._relationships = definitions;
}
