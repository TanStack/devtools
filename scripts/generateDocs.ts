import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { generateReferenceDocs } from '@tanstack/config/typedoc'
import { glob } from 'tinyglobby'

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

// Find all markdown files matching the pattern
const markdownFiles = [
  ...(await glob('docs/reference/**/*.md')),
  ...(await glob('docs/framework/*/reference/**/*.md')),
]

console.log(`Found ${markdownFiles.length} markdown files to process\n`)

// Process each markdown file
markdownFiles.forEach((file) => {
  const content = readFileSync(file, 'utf-8')
  let updatedContent = content
  updatedContent = updatedContent.replaceAll(/\]\(\.\.\//gm, '](../../')
  // updatedContent = content.replaceAll(/\]\(\.\//gm, '](../')
  updatedContent = updatedContent.replaceAll(
    /\]\((?!https?:\/\/|\/\/|\/|\.\/|\.\.\/|#)([^)]+)\)/gm,
    // @ts-expect-error
    (match, p1) => `](../${p1})`,
  )

  // Write the updated content back to the file
  if (updatedContent !== content) {
    writeFileSync(file, updatedContent, 'utf-8')
    console.log(`Processed file: ${file}`)
  }
})

console.log('\n✅ All markdown files have been processed!')

process.exit(0)
