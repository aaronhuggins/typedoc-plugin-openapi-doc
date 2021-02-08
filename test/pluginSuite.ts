import * as TypeDoc from 'typedoc'
import { doesNotThrow, strictEqual } from 'assert'
import { load } from '../index'

describe('Module typedoc-plugin-openapi-doc', () => {
  it('should load into TypeDoc without error', function () {
    this.timeout(8000)
    const app = new TypeDoc.Application()

    doesNotThrow(() => {
      load(app.plugins)
    })

    app.options.addReader(new TypeDoc.TSConfigReader())
    app.bootstrap({
      entryPoints: ["test/stub.ts"]
    } as any)

    const project = app.convert()

    strictEqual(project instanceof TypeDoc.ProjectReflection, true)
  })
})
