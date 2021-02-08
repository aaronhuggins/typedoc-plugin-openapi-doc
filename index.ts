import { Reflection } from 'typedoc/dist/lib/models/reflections/abstract'
import { Component, ConverterComponent } from 'typedoc/dist/lib/converter/components'
import { Converter } from 'typedoc/dist/lib/converter/converter'
import { Context } from 'typedoc/dist/lib/converter/context'
import { ParameterType, PluginHost } from 'typedoc/dist/lib/utils'
import { MarkedPlugin } from 'typedoc/dist/lib/output/plugins/MarkedPlugin'
import * as YAML from 'js-yaml'
import { format } from './jsonTable'

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
}

export interface OpenApiPath {
  summary?: string
  description?: string
  [operation: string]: OpenApiOperation | string
}

type OpenApiOps = Array<{ method: string, metadata: OpenApiOperation}>

export const PLUGIN_NAME = 'openapi-doc'
const DEFAULT_OPTIONS: OpenApiDocOpts = {
  hoistDescription: true,
  yaml2Html: true,
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
  private generatedComment: string
  private options: OpenApiDocOpts
  private marked: MarkedPlugin

  initialize (): void {
    this.listenTo(this.owner, {
      [Converter.EVENT_CREATE_SIGNATURE]: this.onSignature
    })

    this.marked = new MarkedPlugin(this.application.renderer)

    this.generatedComment = '<!-- Generated from @openapi --><br>'

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
    console.log('declaration')

    if (typeof reflection.comment !== 'undefined') {
      if (reflection.comment.hasTag('swagger') || reflection.comment.hasTag('openapi')) {
        const openApi = reflection.comment.hasTag('swagger')
          ? reflection.comment.getTag('swagger')
          : reflection.comment.getTag('openapi')

        if (!openApi.text.startsWith(this.generatedComment)) {
          // Gather data from swagger YAML comment.
          const openApiObj: any = YAML.load(openApi.text)
          const operations: OpenApiOps = []
          let openApiPath: OpenApiPath = {}
          let openApiPathName: string = ''

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

          let rendered = ''

          if (this.options.yaml2Html) {
            rendered = this.renderYaml2Html(openApiPathName, operations)
          } else {
            rendered = this.renderMarkdown(`\`\`\`yaml${openApi.text}\n\`\`\``)
          }

          openApi.text = `${this.generatedComment}${rendered}`
        }
      }
    }
  }

  private renderMarkdown (markdown: string): string {
    const markedEvent = { parsedText: markdown }

    this.marked.onParseMarkdown(markedEvent as any)

    return markedEvent.parsedText
  }

  private renderYaml2Html (pathName: string, operations: OpenApiOps): string {
    const htmlDescription: string[] = []

    htmlDescription.push('<div>')

    for (const item of operations) {
      htmlDescription.push('<style>')
      htmlDescription.push(`label.for-${item.method}{cursor:pointer;}`)
      htmlDescription.push(`label.for-${item.method}:before{content:'\\FF0B';font-size:24px;font-weight:bold;margin-right:2px;color:black;float:left;}`)
      htmlDescription.push(`input[type=checkbox]#toggle-${item.method}:checked ~ label.for-${item.method}:before{content:'\\FF0D';}`)
      htmlDescription.push(`input[type=checkbox]#toggle-${item.method}{position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;}`)
      htmlDescription.push(`.control-${item.method}{max-height:0;overflow:hidden;transition:max-height 0.4s ease;}`)
      htmlDescription.push(`input[type=checkbox]#toggle-${item.method}:checked ~ .control-${item.method}{max-height:unset;}`)
      htmlDescription.push('</style>')
      htmlDescription.push(`<input type="checkbox" id="toggle-${item.method}">`)
      htmlDescription.push(`<label class="for-${item.method}" for="toggle-${item.method}">`)
      htmlDescription.push(`<h3>${item.method.toUpperCase()} <code>${pathName}</code></h3>`)
      htmlDescription.push('</label>')
      htmlDescription.push(`<div class="control-${item.method}">`)

      for (const [key, value] of Object.entries(item.metadata)) {
        htmlDescription.push('<div>')
        htmlDescription.push(`<h4 style="font-weight:bold;">${key[0].toUpperCase() + key.slice(1)}</h4>`)
        htmlDescription.push('<div>')

        if (typeof value === 'object') {
          htmlDescription.push(format(value))
        } else {
          htmlDescription.push(this.renderMarkdown(`${value}`))
        }

        htmlDescription.push('</div>')
        htmlDescription.push('</div>')
      }

      htmlDescription.push('</div>')
    }

    htmlDescription.push('</div>')

    return htmlDescription.join('')
  }
}
