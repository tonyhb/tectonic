import { Model } from 'tectonic';

export default class Account extends Model {
  static modelName = 'account'
  static fields = {
    id: '',
    companyName: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyCountry: '',
    createdAt: new Date(),
    updatedAt: new Date(),

    // features
    maxUsers: 1,
    maxPages: 3,
    minScanFrequency: 8 * 60,
    scanHistory: 365,
    hasSlackNotification: false,
    hasWebhookNotification: false,
    hasGrouping: true,
    hasBranding: false,
    hasTechnology: false,
    hasContentChangeAPI: false,
    hasPhoneSupport: false,
  }
}

// TODO: account routes
export const routes = {};
