import { ParameterType, PluginHost } from 'typedoc/dist/lib/utils'
import { DEFAULT_OPTIONS, PLUGIN_NAME } from './constants'
import { OpenApiDocOpts } from './interfaces'
import { OpenApiDocPlugin } from './OpenApiDocPlugin'

export function load (host: PluginHost): void {
  const app = host.owner

  app.options.addDeclaration({
    name: PLUGIN_NAME,
    help: '',
    type: ParameterType.Mixed,
    defaultValue: DEFAULT_OPTIONS,
    validate(value: OpenApiDocOpts) {
      if (typeof value !== 'object') throw new Error(`${PLUGIN_NAME} must be one of object.`)

      const evaluate = (prop: string, types: string[]) => {
        if (prop in value) {
          let error = true

          for (const type of types) {
            if (typeof value[prop] === type) error = false
          }

          if (error) throw new Error(`${prop} must be one of ${types.join(', ')}.`)
        }
      }

      evaluate('hoistDescription', ['boolean'])
      evaluate('yaml2Html', ['boolean'])
      evaluate('renameTag', ['boolean', 'string'])
    }
  })
  app.converter.addComponent(PLUGIN_NAME, new OpenApiDocPlugin(app.converter))
}
