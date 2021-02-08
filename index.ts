import { Reflection } from 'typedoc/dist/lib/models/reflections/abstract'
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components'
import { Converter } from 'typedoc/dist/lib/converter/converter'
import { Context } from 'typedoc/dist/lib/converter/context'
import { ParameterType, PluginHost } from 'typedoc/dist/lib/utils'
import * as YAML from 'js-yaml'
import { CommentTag } from 'typedoc/dist/lib/models/comments/tag'
import { format } from './jsonTable'

export interface OpenApiDocOpts {
  /** Hoists the summary and description found in the swagger/openapi path or operation to the signature description. Defaults to true. */
  hoistDescription?: boolean
  /** Render the swagger/openapi tag as a code block instead of additional tags. Defaults to false. */
  renderYaml?: boolean
  /** Rename the tag from 'swagger' or 'openapi' to something else. Defaults to true, enforcing 'openapi'; provide a different name or set to false to disable. */
  renameTag?: boolean | string
}

export interface OpenApiOperation {
  summary?: string
  description?: string
}

export interface OpenApiPath {
  summary?: string
  description?: string
  [operation: string]: OpenApiOperation | string
}

export const PLUGIN_NAME = 'openapi-doc'
const DEFAULT_OPTIONS: OpenApiDocOpts = {
  hoistDescription: true,
  renderYaml: false,
  renameTag: true
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
  app.converter.addComponent(PLUGIN_NAME, new OpenApiDocPlugin(app.converter))
}

@Component({ name: PLUGIN_NAME })
export class OpenApiDocPlugin extends ConverterComponent {
  private options: OpenApiDocOpts

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
    const generatedComment = '<!-- Generated from @openapi --><br>'
    console.log('declaration')

    if (typeof reflection.comment !== 'undefined') {
      if (reflection.comment.hasTag('swagger') || reflection.comment.hasTag('openapi')) {
        const openApi = reflection.comment.hasTag('swagger')
          ? reflection.comment.getTag('swagger')
          : reflection.comment.getTag('openapi')

        if (!openApi.text.startsWith(generatedComment)) {
          // Gather data from swagger YAML comment.
          const openApiObj: any = YAML.load(openApi.text)
          let openApiPath: OpenApiPath = {}
          let openApiPathName: string = ''
          const operations: Array<{ method: string, metadata: OpenApiOperation}> = []

          for (const [key, value] of Object.entries(openApiObj)) {
            if (typeof value === 'object') {
              openApiPath = value as any
              openApiPathName = key

              break
            }
          }

          for (const [key, value] of Object.entries(openApiPath)) {
            if (SUPPORTED_METHODS.includes(key)) {
              operations.push({
                method: key,
                metadata: value as any
              })
            }
          }

          // Perform actions from options.
          if (this.options.hoistDescription) {
            const openApiOp: OpenApiOperation = typeof operations[0] === 'undefined' ? {} : operations[0].metadata

            switch (true) {
              case 'summary' in openApiPath:
                reflection.comment.shortText = openApiPath.summary
              case 'description' in openApiPath:
                if (typeof openApiPath.summary === 'undefined') {
                  reflection.comment.shortText = openApiPath.description
                } else {
                  reflection.comment.text = openApiPath.description
                }
                break
              case 'summary' in openApiOp:
                reflection.comment.shortText = openApiOp.summary
              case 'description' in openApiOp:
                if (typeof openApiOp.summary === 'undefined') {
                  reflection.comment.shortText = openApiOp.description
                } else {
                  reflection.comment.text = openApiOp.description
                }
                break
            }
          }

          if (typeof this.options.renameTag === 'string') {
            openApi.tagName = this.options.renameTag
          }

          if (this.options.renderYaml) {
            openApi.text = `${generatedComment}<pre>${openApi.text}</pre>`
          } else {
            // reflection.comment.removeTags(openApi.tagName)
            const htmlDescription: string[] = [generatedComment]
            // const addHtmlPart = (name: string, html: string = '') => htmlDescription.push(`<div><h4>${name}<h4>${html}</div>`)
            htmlDescription.push('<div>')
            // htmlDescription.push(`<div class="lead"><p>Endpoint: <code>${openApiPathName}</code></p></div>`)

            for (const item of operations) {
              htmlDescription.push('<style>')
              htmlDescription.push(`label.for-${item.method}{cursor:pointer;}`)
              htmlDescription.push(`input[type=checkbox]#toggle-${item.method}{position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;}`)
              htmlDescription.push(`.control-${item.method}{max-height:0;overflow:hidden;transition:max-height 0.4s ease;}`)
              htmlDescription.push(`input[type=checkbox]#toggle-${item.method}:checked ~ .control-${item.method}{max-height:unset;}`)
              htmlDescription.push('</style>')
              htmlDescription.push(`<label class="for-${item.method}" for="toggle-${item.method}">`)
              htmlDescription.push(`<h3>${item.method.toUpperCase()} <code>${openApiPathName}</code></h3>`)
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
                  openApi.tagName + ' ' + item.method.toUpperCase() + ' ' + key,
                  '',
                  typeof value === 'object' ? format(value) : value
                )

                reflection.comment.tags.push(tag) */
              }
              htmlDescription.push('</div>')
            }

            htmlDescription.push('</div>')

            openApi.text = htmlDescription.join('')
            console.log(openApi.text)
          }
        }
      }
    }
  }
}
