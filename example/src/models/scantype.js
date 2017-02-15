import { Model } from 'tectonic';

export default class ScanType extends Model {
  static modelName = 'scanType';

  static idField = 'format';

  static fields = {
    format: '',
    width: 1280,
  }

}
