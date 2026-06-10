import type { QueryStringValue } from '../../report-url/index.js';

export type SSRSReportParamValue = Exclude<QueryStringValue, null>;