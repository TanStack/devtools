import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'
import { withSolidV2 } from '../../scripts/tsup-solid-v2'

const preset_options = {
  entries: {
    entry: 'src/index.ts',
    dev_entry: true,
    server_entry: true,
  },
  cjs: false,
  drop_console: true,
}

export default defineConfig(() => {
  const parsed_data = parsePresetOptions(preset_options)
  const tsup_options = withSolidV2(generateTsupOptions(parsed_data))

  return tsup_options.map((option) => ({
    ...option,
    loader: {
      '.png': 'dataurl',
    },
  }))
})
