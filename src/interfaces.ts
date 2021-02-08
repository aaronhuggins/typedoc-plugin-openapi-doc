export interface OpenApiDocOpts {
  /** Hoists the summary and description found in the swagger/openapi path or operation to the signature description; defaults to true. */
  hoistDescription?: boolean
  /** Render the swagger/openapi tag as pretty HTML instead of a code block; defaults to true. */
  yaml2Html?: boolean
  /** Rename the tag from 'swagger' or 'openapi' to something else. Defaults to true, enforcing 'openapi'; provide a different name or set to false to disable. */
  renameTag?: boolean | string
}

export interface OpenApiOperation {
  summary?: string
  description?: string
  [property: string]: any
}

export interface OpenApiPath {
  summary?: string
  description?: string
  [operation: string]: OpenApiOperation | string
}

export type OpenApiOps = Array<{ method: string, metadata: OpenApiOperation}>
