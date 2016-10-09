

const PENDING = 'PENDING';
const SUCCESS = 'SUCCESS';
const ERROR = 'ERROR';
// UNDEFINED_PARAMS is used when a query has some params missing (ie.
// undefined). This typically suggests that the query is dependent on other
// queries which are in-flight. In this scenario the query is not PENDING nor
// has it failed.
const UNDEFINED_PARAMS = 'UNDEFINED_PARAMS';

export { PENDING, SUCCESS, ERROR, UNDEFINED_PARAMS };
