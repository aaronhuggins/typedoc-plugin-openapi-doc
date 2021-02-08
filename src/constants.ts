import { OpenApiDocOpts } from './interfaces'

/** The default plugin name. */
export const PLUGIN_NAME = 'openapi-doc'

/** Default options for this plugin. */
export const DEFAULT_OPTIONS: Required<OpenApiDocOpts> = {
  hoistDescription: true,
  yaml2Html: true,
  renameTag: true
}

/** OpenAPI supported methods. */
export const SUPPORTED_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
