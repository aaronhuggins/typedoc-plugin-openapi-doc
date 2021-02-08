import { OpenApiDocOpts } from "./interfaces"

export const PLUGIN_NAME = 'openapi-doc'
export const DEFAULT_OPTIONS: OpenApiDocOpts = {
  hoistDescription: true,
  yaml2Html: true,
  renameTag: true
}
export const SUPPORTED_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
