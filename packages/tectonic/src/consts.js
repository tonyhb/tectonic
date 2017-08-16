// @flow

import type Status from './status/status';

// These consts are used within queries to state whether the query lists,
// creates, updates or deletes a model
export const GET = 'GET';
export const CREATE = 'CREATE';
export const UPDATE = 'UPDATE';
export const DELETE = 'DELETE';

// Used to determine whether any source for an item or list returns all model
// fields
export const RETURNS_ALL_FIELDS = '*';
// Used to determine whether a source returns a single item or a list of items
export const RETURNS_ITEM = 'ITEM';
export const RETURNS_LIST = 'LIST';
// Used within DELETE queries to represent that the query has no return data.
// Noe that this cannot be used with GET queries.
// TODO: Should this be used for POST and PATCH? Spec:
// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
export const RETURNS_NONE = 'NONE';

export type StatusPending = 'PENDING';
export type StatusSuccess = 'SUCCESS';
export type StatusError = 'ERROR';
export type StatusUndefinedParams = 'UNDEFINED_PARAMS';
export type StatusType = StatusPending | StatusSuccess | StatusError | StatusUndefinedParams;

export type QueryGet = 'GET';
export type QueryCreate = 'CREATE';
export type QueryUpdate = 'UPDATE';
export type QueryDelete = 'DELETE';
export type QueryType = QueryGet | QueryCreate | QueryUpdate | QueryDelete;

export type ReturnsItem = 'ITEM';
export type ReturnsList = 'LIST';
export type ReturnsNone = 'NONE';
export type ReturnType = ReturnsItem | ReturnsList | ReturnsNone;

export type ReturnsAllFields = '*';
export type ParamsType = { [key: string]: any }
export type QueryHash = string;
export type ModelName = string;
export type Id = string | number;

export type ModelData = {
  [key: Id]: {
    data: any,
    cache: {
      expires: Date,
    },
  },
}

export type ModelCollection = {
  [key: ModelName]: ModelData
};

export type Props = {
  status: {
    [key: string]: Status,
  },
  [key: string]: any
};
