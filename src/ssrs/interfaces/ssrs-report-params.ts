import type { SSRSReportParamValue } from './ssrs-report-param-value.js';

/**
 * A `null` value marks the whole parameter as null; it is sent to the server
 * using the SSRS URL Access syntax (`param:isnull=true`). Multi-value arrays
 * cannot contain `null` members because SSRS does not support them.
 */
export type SSRSReportParams = Record<string, SSRSReportParamValue | SSRSReportParamValue[] | null>;
