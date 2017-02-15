import { Model } from 'tectonic';
import Scan from './scan';
import Site from './site';

export default class Page extends Model {
  static modelName = 'page';

  static fields = {
    id: '',
    name: '',
    url: '',
    scanFrequency: 8 * 60,
    monitoredAreas: [],
    ignoredAreas: [],
    threshold: 'all',

    site: new Site(),
    lastScan: new Scan(),

    createdAt: new Date(),
    updatedAt: new Date(),
  }

  /**
   * Returns either the name or the URL of the page for use as the title
   */
  title() {
    if (this.name !== '') {
      return this.name;
    }
    return this.url;
  }
}

export const routes = [
  {
    meta: {
      url: '/api/v0/pages',
    },
    returns: Page.list(),
  },
  {
    meta: {
      url: '/api/v0/site/:domain/pages',
    },
    params: ['domain'],
    returns: Page.list(),
  },
  {
    meta: {
      url: '/api/v0/pages/:id',
    },
    params: ['id'],
    returns: Page.item(),
  },
];
