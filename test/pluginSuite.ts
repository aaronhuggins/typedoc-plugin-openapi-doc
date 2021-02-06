import * as TypeDoc from 'typedoc'
import { strictEqual } from 'assert'
import { load } from '../index'

const OUT_DIR = ".test-docs";

describe('thing', () => {
  it('should do something', async () => {
    const app = new TypeDoc.Application()

    load(app.plugins)
    app.options.addReader(new TypeDoc.TSConfigReader());
    app.options.addReader(new TypeDoc.TypeDocReader());
    app.bootstrap({
      entryPoints: ["test/stub.ts"]
    } as any)

    const project = app.convert()

    strictEqual(project instanceof TypeDoc.ProjectReflection, true)

    await app.generateDocs(project, OUT_DIR)
  })
})
