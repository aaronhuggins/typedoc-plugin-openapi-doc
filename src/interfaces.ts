/** Interface describing OpenAPIDoc Options */
export interface OpenApiDocOpts {
  /** Hoists the summary and description found in the swagger/openapi path or operation to the signature description; defaults to true. */
  hoistDescription?: boolean
  /** Render the swagger/openapi tag as pretty HTML instead of a code block; defaults to true. */
  yaml2Html?: boolean
  /** Rename the tag from 'swagger' or 'openapi' to something else. Defaults to true, enforcing 'openapi'; provide a different name or set to false to disable. */
  renameTag?: boolean | string
}

/** Internal use only. Helper interface for dealing with OpenAPI operation objects. */
export interface OpenApiOperation {
  summary?: string
  description?: string
  [property: string]: any
}

/** Internal use only. Helper interface for dealing with OpenAPI path objects */
export interface OpenApiPath {
  summary?: string
  description?: string
  [operation: string]: OpenApiOperation | string
}

/** Internal use only. Helper type for dealing with passing data about OpenAPI operations. */
export type OpenApiOps = Array<{ method: string, metadata: OpenApiOperation}>
