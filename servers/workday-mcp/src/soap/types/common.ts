/** Scalar ID used throughout Workday objects */
export type WorkdayID = string;

/** A typed reference to a Workday business object.
 *  Uses the `soap` package's xml2js input convention: `$value` for text,
 *  `attributes` for XML attributes.
 */
export interface WorkdayReference {
  ID: Array<{ $value: string; attributes: { "wd:type": string } }>;
}

/** Generic Workday named object (has WID + descriptor) */
export interface WorkdayObject {
  WID?: string;
  descriptor?: string;
}

/** Workday response envelope — wraps every SOAP response */
export interface ResponseEnvelope<T> {
  Response_Data?: T;
  Response_Filter?: ResponseFilter;
  Response_Results?: ResponseResults;
}

export interface ResponseFilter {
  Page?: number;
  Count?: number;
  As_Of_Date?: string;
  As_Of_Moment?: string;
}

export interface ResponseResults {
  Total_Results?: number;
  Total_Pages?: number;
  Page_Results?: number;
  Page?: number;
}

/** Common request filter used by Get_ operations */
export interface RequestFilter {
  As_Of_Date?: string;
  As_Of_Moment?: string;
}

/** Paged request criteria included in most Get_ operations */
export interface RequestCriteria {
  [key: string]: unknown;
}

export interface RequestReferences {
  [key: string]: WorkdayReference | WorkdayReference[];
}

/** Standard paged request structure */
export interface PagedRequest {
  Response_Filter?: ResponseFilter;
  Request_Criteria?: RequestCriteria;
  Request_References?: RequestReferences;
}

/** Workday effective-dated period */
export interface EffectiveDateRange {
  Updated_From?: string;
  Updated_Through?: string;
}
