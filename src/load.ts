import { ParameterType, PluginHost } from 'typedoc/dist/lib/utils'
import { PLUGIN_NAME } from './constants'
import { OpenApiDocPlugin } from './OpenApiDocPlugin'

export function load (host: PluginHost): void {
  const app = host.owner

  app.options.addDeclaration({
    name: PLUGIN_NAME,
    help: '',
    type: ParameterType.Map,
    defaultValue: {},
    map: {}
  })
  app.converter.addComponent(PLUGIN_NAME, new OpenApiDocPlugin(app.converter))
}
