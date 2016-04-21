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
export const RETURNS_ITEM = 'item';
export const RETURNS_LIST = 'list';
// Used within DELETE queries to represent that the query has no return data.
// Noe that this cannot be used with GET queries.
// TODO: Should this be used for POST and PATCH? Spec:
// https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html
export const RETURNS_NONE = 'none';
