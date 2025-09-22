type OpenSourceData = {
  type: 'open-source'
  data: {
    /** The source file to open */
    source?: string
    /** The react router route ID, usually discovered via the hook useMatches */
    routeID?: string
    /** The line number in the source file */
    line?: number
    /** The column number in the source file */
    column?: number
  }
}

export type EditorConfig = {
  /** The name of the editor, used for debugging purposes */
  name: string
  /** Callback to open a file in the editor */
  open: (
    path: string,
    lineNumber: string | undefined,
    columnNumber?: string,
  ) => Promise<void>
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  name: 'VSCode',
  open: async (path, lineNumber, columnNumber) => {
    const launch = (await import('launch-editor')).default
    launch(
      `${path.replaceAll('$', '\\$')}${lineNumber ? `:${lineNumber}` : ''}${columnNumber ? `:${columnNumber}` : ''}`,
      undefined,
      (filename, err) => {
        console.warn(`Failed to open ${filename} in editor: ${err}`)
      },
    )
  },
}

export const handleOpenSource = async ({
  data,
  openInEditor,
}: {
  data: OpenSourceData
  openInEditor: EditorConfig['open']
}) => {
  const { source, line, column } = data.data
  const lineNum = line ? `${line}` : undefined
  const columnNum = column ? `${column}` : undefined
  if (source) {
    return openInEditor(source, lineNum, columnNum)
  }
}
