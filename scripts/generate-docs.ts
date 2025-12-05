import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateReferenceDocs } from '@tanstack/typedoc-config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

await generateReferenceDocs({
  packages: [
    {
      name: 'devtools',
      entryPoints: [resolve(__dirname, '../packages/devtools/src/index.ts')],
      tsconfig: resolve(__dirname, '../packages/devtools/tsconfig.docs.json'),
      outputDir: resolve(__dirname, '../docs/reference'),
    },
    {
      name: 'react-devtools',
      entryPoints: [
        resolve(__dirname, '../packages/react-devtools/src/index.ts'),
      ],
      tsconfig: resolve(
        __dirname,
        '../packages/react-devtools/tsconfig.docs.json',
      ),
      outputDir: resolve(__dirname, '../docs/framework/react/reference'),
      exclude: ['packages/devtools/**/*'],
    },
    {
      name: 'solid-devtools',
      entryPoints: [
        resolve(__dirname, '../packages/solid-devtools/src/index.ts'),
      ],
      tsconfig: resolve(
        __dirname,
        '../packages/solid-devtools/tsconfig.docs.json',
      ),
      outputDir: resolve(__dirname, '../docs/framework/solid/reference'),
      exclude: ['packages/devtools/**/*'],
    },
  ],
})

console.log('\n✅ All markdown files have been processed!')

process.exit(0)
