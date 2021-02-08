import * as TypeDoc from 'typedoc'
import { Logger } from 'typedoc/dist/lib/utils/loggers'
import { doesNotThrow, strictEqual } from 'assert'
import { load } from '../index'

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
        yaml2Html: false
      }
    } as any)

    const project = app.convert()

    strictEqual(project instanceof TypeDoc.ProjectReflection, true)
  })
})
