// @flow

import type {
  StatusType,
} from '../consts';

export type StatusOpts = {
  status?: StatusType;
  code?: number;
  error?: string;
}

export default class Status {

  status: ?StatusType
  code: ?number
  error: ?string

  constructor({ status, code, error}: StatusOpts = { }) {
    if (status) {
      this.status = status;
    }

    this.code = code;
    this.error = error;
  }

  isPending(): boolean {
    return this.status === 'PENDING';
  }

  isSuccess(): boolean {
    return this.status === 'SUCCESS';
  }

  isError(): boolean {
    return this.status === 'ERROR';
  }

  isUndefinedParams() {
    return this.status === 'UNDEFINED_PARAMS';
  }

}
