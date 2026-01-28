import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'

const preset_options = {
  entries: {
    entry: 'src/solid/index.ts',
    dev_entry: true,
    // Don't use tsup-preset-solid's server_entry as it still imports solid-js
    server_entry: false,
  },

  cjs: false,
}

export default defineConfig(() => {
  const parsed_data = parsePresetOptions(preset_options)
  const tsup_options = generateTsupOptions(parsed_data)

  // Add custom server entry that has no solid-js imports
  const serverEntry = {
    entry: { server: 'src/solid/server.ts' },
    outDir: './dist/solid/esm',
    format: ['esm'] as const,
    dts: true,
    clean: false,
  }

  return [
    ...tsup_options.map((o) => ({
      ...o,
      outDir: './dist/solid/esm',
      clean: false,
    })),
    serverEntry,
  ]
})
