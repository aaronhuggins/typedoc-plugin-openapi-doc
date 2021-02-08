import * as TypeDoc from 'typedoc'
import { Logger } from 'typedoc/dist/lib/utils/loggers'
import { doesNotThrow, strictEqual } from 'assert'
import { load, OpenApiDocPlugin } from '../index'
import { format } from '../src/jsonTable'
import { DUMMY_APPLICATION_OWNER } from 'typedoc/dist/lib/utils/component'

describe('Module typedoc-plugin-openapi-doc', () => {
  it('should load into TypeDoc without error', function () {
    const app = new TypeDoc.Application()

    doesNotThrow(() => {
      load(app.plugins)
    })
  })

  it('should gracefully handle invalid options', function () {
    this.timeout(8000)
    const app = new TypeDoc.Application()
    app.logger = new Logger()

    load(app.plugins)
    app.options.addReader(new TypeDoc.TSConfigReader())
    app.bootstrap({
      entryPoints: ['test/stub.ts'],
      'openapi-doc': true
    } as any)
    app.bootstrap({
      entryPoints: ['test/stub.ts'],
      'openapi-doc': {
        hoistDescription: 13
      }
    } as any)

    doesNotThrow(() => {
      app.convert()
    })
  })

  it('should parse @swagger or @openapi comments', function () {
    this.timeout(8000)
    const app = new TypeDoc.Application()
    app.logger = new Logger()

    load(app.plugins)

    app.options.addReader(new TypeDoc.TSConfigReader())
    app.bootstrap({
      entryPoints: ['test/stub.ts'],
      'openapi-doc': {}
    } as any)

    const project = app.convert()

    strictEqual(project instanceof TypeDoc.ProjectReflection, true)
  })

  it('should render @swagger or @openapi comments as a code block', function () {
    this.timeout(8000)
    const app = new TypeDoc.Application()
    app.logger = new Logger()

    load(app.plugins)

    app.options.addReader(new TypeDoc.TSConfigReader())
    app.bootstrap({
      entryPoints: ['test/stub.ts'],
      'openapi-doc': {
        yaml2Html: false,
        renameTag: 'OpenAPI'
      }
    } as any)

    const project = app.convert()

    strictEqual(project instanceof TypeDoc.ProjectReflection, true)
  })

  it('should handle unknown type in yaml/json input', function () {
    doesNotThrow(() => {
      format({ unkown: () => {} })
    })
  })

  it('should handle errors in options', function () {
    const instance: any = new OpenApiDocPlugin(DUMMY_APPLICATION_OWNER)

    doesNotThrow(() => {
      instance.ensureOptions()
    })
  })
})
