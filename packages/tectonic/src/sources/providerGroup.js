// @flow

import Provider from './provider';
import type Model from '../model';

type ProviderDefinition = {
  key?: string;
  provider: Provider;
};

/**
 * ProvierGroup is used within a SourceDefinition to specify what an API returns.
 *
 * It can hold one or many Provider instances; having one instance specifies that
 * the API returns one model whereas many specifies that the API returns many
 * model's data.
 */
export default class ProviderGroup {

  returnsNone: boolean = false

  defs: Array<ProviderDefinition> = []

  constructor(defs: Provider | { [key: string]: Provider } | ?string) {
    if (defs == null || defs === 'NONE') {
      this.returnsNone = true;
    } else if (defs instanceof Provider) {
      this.defs = [{ provider: defs }];
    } else if (typeof defs === 'object') {
      this._constructWithObj(defs);
    }
  }

  _constructWithObj(defs: { [key: string]: Provider }) {
    this.defs = Object.keys(defs).map((key) => {
      if (!(defs[key] instanceof Provider)) {
        throw new Error(
          'Source definition must be comrpised of models, such as Model.list()',
          defs[key]
        );
      }

      return {
        key,
        provider: defs[key],
      };
    });
    return;
  }

  isPolymorphic(): boolean {
    return !this.returnsNone && this.defs.length > 1;
  }

  providers(): Array<Provider> {
    return this.defs.map(def => def.provider);
  }

  providerForModel(model: Class<Model>): ?Provider {
    const def = this
      .defs
      .find(d => d.provider.model === model);

    if (def === null || def === undefined) {
      return undefined;
    }
    return def.provider;
  }

  models(): Array<Class<Model>> {
    return this
      .defs
      .map(r => r.provider.model);
  }

}
