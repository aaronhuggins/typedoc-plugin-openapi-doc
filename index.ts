import { Reflection } from 'typedoc/dist/lib/models/reflections/abstract'
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components'
import { Converter } from 'typedoc/dist/lib/converter/converter'
import { Context } from 'typedoc/dist/lib/converter/context'
import { ParameterType, PluginHost } from 'typedoc/dist/lib/utils'
import * as YAML from 'js-yaml'
import { CommentTag } from 'typedoc/dist/lib/models/comments/tag'
import { format } from './jsonTable'

export interface SwaggerDocOpts {
  /** Hoists the summary and description found in the swagger operation to the signature description. Defaults to true. */
  hoistDescription?: boolean
  /** Render the swagger tag as a code block instead of additional tags. Defaults to false. */
  renderYaml?: boolean
  /** Rename the tag from 'swagger' to something else. Defaults to false; set to true to rename to 'openapi'. */
  renameTag?: boolean | string
}

export interface SwaggerOperation {
  summary?: string
  description?: string
}

export interface SwaggerPath {
  summary?: string
  description?: string
  [operation: string]: SwaggerOperation | string
}

export const PLUGIN_NAME = 'swagger-doc'
const DEFAULT_OPTIONS: SwaggerDocOpts = {
  hoistDescription: true,
  renderYaml: false,
  renameTag: false
}
const SUPPORTED_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

export function load (host: PluginHost): void {
  const app = host.owner

  app.options.addDeclaration({
    name: PLUGIN_NAME,
    help: '',
    type: ParameterType.Map,
    defaultValue: {},
    map: {}
  })
  app.converter.addComponent(PLUGIN_NAME, new SwaggerDocPlugin(app.converter))
}

@Component({ name: PLUGIN_NAME })
export class SwaggerDocPlugin extends ConverterComponent {
  private options: SwaggerDocOpts

  initialize (): void {
    this.listenTo(this.owner, {
      [Converter.EVENT_CREATE_SIGNATURE]: this.onSignature
    })

    try {
      const userOptions: any = this.owner.application.options.getValue(PLUGIN_NAME)
      this.options = {
        ...DEFAULT_OPTIONS,
        ...userOptions
      }
    } catch (error) {
      this.options = {
        ...DEFAULT_OPTIONS
      }
    }

    if (typeof this.options.renameTag === 'boolean' && this.options.renameTag) {
      this.options.renameTag = 'openapi'
    }
  }

  private onSignature (context: Context, reflection: Reflection, node?: any): void {
    const generatedComment = '<!-- Generated from @swagger --><br>'
    console.log('declaration')

    if (typeof reflection.comment !== 'undefined') {
      if (reflection.comment.hasTag('swagger')) {
        const swagger = reflection.comment.getTag('swagger')

        if (!swagger.text.startsWith(generatedComment)) {
          // Gather data from swagger TAML comment.
          const swaggerObj: any = YAML.load(swagger.text)
          let swaggerPath: SwaggerPath = {}
          let swaggerPathName: string = ''
          const operations: Array<{ method: string, metadata: SwaggerOperation}> = []

          for (const [key, value] of Object.entries(swaggerObj)) {
            if (typeof value === 'object') {
              swaggerPath = value as any
              swaggerPathName = key

              break
            }
          }

          for (const [key, value] of Object.entries(swaggerPath)) {
            if (SUPPORTED_METHODS.includes(key)) {
              operations.push({
                method: key,
                metadata: value as any
              })
            }
          }

          // Perform actions from options.
          if (this.options.hoistDescription) {
            const swaggerOp: SwaggerOperation = typeof operations[0] === 'undefined' ? {} : operations[0].metadata

            switch (true) {
              case 'summary' in swaggerPath:
                reflection.comment.shortText = swaggerPath.summary
              case 'description' in swaggerPath:
                if (typeof swaggerPath.summary === 'undefined') {
                  reflection.comment.shortText = swaggerPath.description
                } else {
                  reflection.comment.text = swaggerPath.description
                }
                break
              case 'summary' in swaggerOp:
                reflection.comment.shortText = swaggerOp.summary
              case 'description' in swaggerOp:
                if (typeof swaggerOp.summary === 'undefined') {
                  reflection.comment.shortText = swaggerOp.description
                } else {
                  reflection.comment.text = swaggerOp.description
                }
                break
            }
          }

          if (typeof this.options.renameTag === 'string') {
            swagger.tagName = this.options.renameTag
          }

          if (this.options.renderYaml) {
            swagger.text = `${generatedComment}<pre>${swagger.text}</pre>`
          } else {
            // reflection.comment.removeTags(swagger.tagName)
            const htmlDescription: string[] = [generatedComment]
            // const addHtmlPart = (name: string, html: string = '') => htmlDescription.push(`<div><h4>${name}<h4>${html}</div>`)
            htmlDescription.push('<div>')
            // htmlDescription.push(`<div class="lead"><p>Endpoint: <code>${swaggerPathName}</code></p></div>`)

            for (const item of operations) {
              htmlDescription.push('<style>')
              htmlDescription.push(`label.for-${item.method}{cursor:pointer;}`)
              htmlDescription.push(`input[type=checkbox]#toggle-${item.method}{position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;}`)
              htmlDescription.push(`.control-${item.method}{max-height:0;overflow:hidden;transition:max-height 0.4s ease;}`)
              htmlDescription.push(`input[type=checkbox]#toggle-${item.method}:checked ~ .control-${item.method}{max-height:unset;}`)
              htmlDescription.push('</style>')
              htmlDescription.push(`<label class="for-${item.method}" for="toggle-${item.method}">`)
              htmlDescription.push(`<h3>${item.method.toUpperCase()} <code>${swaggerPathName}</code></h3>`)
              htmlDescription.push('</label>')
              htmlDescription.push(`<input type="checkbox" id="toggle-${item.method}">`)
              htmlDescription.push(`<div class="control-${item.method}">`)
              for (const [key, value] of Object.entries(item.metadata)) {
                htmlDescription.push('<div>')
                htmlDescription.push(`<h4 style="font-weight:bold;">${key[0].toUpperCase() + key.slice(1)}</h4>`)
                htmlDescription.push('<div>')
                htmlDescription.push(typeof value === 'object' ? format(value) : `<p>${value}</p>`)
                htmlDescription.push('</div>')
                htmlDescription.push('</div>')
                /* const tag: CommentTag = new CommentTag(
                  swagger.tagName + ' ' + item.method.toUpperCase() + ' ' + key,
                  '',
                  typeof value === 'object' ? format(value) : value
                )

                reflection.comment.tags.push(tag) */
              }
              htmlDescription.push('</div>')
            }

            htmlDescription.push('</div>')

            swagger.text = htmlDescription.join('')
            console.log(swagger.text)
          }
        }
      }
    }
  }
}
