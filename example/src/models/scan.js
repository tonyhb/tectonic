import {
  Model,
  UPDATE,
  DELETE,
} from 'tectonic';
import { humanDate, monthYear } from '../util/date.js';
import ScanType from './scantype';

export default class Scan extends Model {
  static modelName = 'scan';

  static fields = {
    id: '',
    pageId: '',
    name: '',
    type: new ScanType(),
    tags: [],
    isValid: true,

    htmlHash: '',
    htmlSize: 0,
    imageHash: '',
    imageSize: 0,
    imageMime: '',
    imageDifference: 0,

    createdAt: new Date(),
    updatedAt: new Date(),
  }

  static filter(data) {
    const copy = { ...data };
    // TODO: Automatic parsing of date fields
    copy.createdAt = new Date(data.createdAt);
    copy.updatedAt = new Date(data.updatedAt);
    return copy;
  }

  // getTitle returns the name of the scan or a default
  getTitle() {
    return this.name || 'scan';
  }

  // imageUrl returns the image URL for the scan or a placeholder if the image
  // does not yet exist
  imageUrl() {
    // use a placeholder for now
    return 'https://placehold.it/1280x800';
  }

  monthYear() {
    return monthYear(this.createdAt);
  }

  humanDate() {
    return humanDate(this.createdAt);
  }

  /**
   * updateOpts is a utility function for returning the options for
   * `props.query` when updating a model.
   */
  updateOpts(values = {}) {
    return {
      queryType: UPDATE,
      model: this.constructor,
      modelId: this.id,
      // body is the PUT payload sent to the server; this contains our
      // model data
      body: {
        ...this.toJS(), // add existing values
        ...values, // add values after, overwriting any current values
      },
      // these are the params for the route we specified to update scans
      params: {
        page: this.pageId,
        id: this.id,
      },
    };
  }

  /**
   * deleteOpts is a utility function for returning the options for
   * `props.query` when deleting a model.
   */
  deleteOpts() {
    return {
      queryType: DELETE,
      model: this.constructor, // the Scan model itself
      modelId: this.id,
      params: {
        page: this.pageId,
        id: this.id,
      },
    };
  }
}

export const routes = [
  {
    meta: {
      url: '/api/v0/pages/:page/scans',
    },
    params: ['page'],
    returns: Scan.list(),
  },
  {
    meta: {
      url: '/api/v0/pages/:page/scans/:id',
    },
    params: ['page', 'id'],
    returns: Scan.item(),
  },
  {
    meta: {
      url: '/api/v0/pages/:page/scans/:id',
      method: 'PUT',
    },
    params: ['page', 'id'],
    queryType: UPDATE,
    returns: Scan.item(),
  },
  {
    meta: {
      url: '/api/v0/pages/:page/scans/:id',
      method: 'DELETE',
    },
    params: ['page', 'id'],
    queryType: DELETE,
    model: Scan,
  },
];
