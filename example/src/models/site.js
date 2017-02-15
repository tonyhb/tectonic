import { Model } from 'tectonic';

export default class Site extends Model {
  static modelName = 'site';

  static fields = {
    id: '',
    domain: '',
    urls: [],
  }
}

export const routes = [
  {
    meta: {
      url: '/api/v0/sites',
    },
    returns: Site.list(),
  },
  {
    meta: {
      url: '/api/v0/sites/:domain',
    },
    params: ['domain'],
    returns: Site.item(),
  },
];
