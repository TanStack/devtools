import { describe, expect, test } from 'vitest'
import {
  detectDevtoolsFile,
  findDevtoolsComponentName,
  transformAndInject,
} from './inject-plugin'
import { gen, parse } from './babel'

const removeEmptySpace = (str: string) => {
  return str.replace(/\s/g, '').trim()
}

// Helper to test transformation without file I/O
const testTransform = (
  code: string,
  packageName: string,
  pluginName: string,
  pluginImport: {
    importName: string
    type: 'jsx' | 'function'
  },
) => {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  const devtoolsComponentName = findDevtoolsComponentName(ast)
  if (!devtoolsComponentName) {
    return { transformed: false, code }
  }

  const didTransform = transformAndInject(
    ast,
    { packageName, pluginName, pluginImport },
    devtoolsComponentName,
  )

  if (!didTransform) {
    return { transformed: false, code }
  }

  const result = gen(ast, { sourceMaps: false, retainLines: false })
  return { transformed: true, code: result.code }
}

describe('inject-plugin', () => {
  describe('detectDevtoolsFile', () => {
    test('should detect named import from @tanstack/react-devtools', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
      `
      expect(detectDevtoolsFile(code)).toBe(true)
    })

    test('should detect named import from @tanstack/solid-devtools', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/solid-devtools'
      `
      expect(detectDevtoolsFile(code)).toBe(true)
    })

    test('should detect namespace import', () => {
      const code = `
        import * as Devtools from '@tanstack/react-devtools'
      `
      expect(detectDevtoolsFile(code)).toBe(true)
    })

    test('should detect renamed named import', () => {
      const code = `
        import { TanStackDevtools as DevtoolsPanel } from '@tanstack/react-devtools'
      `
      expect(detectDevtoolsFile(code)).toBe(true)
    })

    test('should not detect non-devtools imports', () => {
      const code = `
        import React from 'react'
        import { useState } from 'react'
      `
      expect(detectDevtoolsFile(code)).toBe(false)
    })

    test('should not detect files without imports', () => {
      const code = `
        function App() {
          return <div>Hello</div>
        }
      `
      expect(detectDevtoolsFile(code)).toBe(false)
    })

    test('should handle invalid code gracefully', () => {
      const code = `
        this is not valid javascript{{{
      `
      expect(detectDevtoolsFile(code)).toBe(false)
    })
  })

  describe('named import pattern', () => {
    test('should add plugin to existing empty plugins array', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should add plugin to existing plugins array with other plugins', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { OtherPlugin } from '@tanstack/other-plugin'
        
        function App() {
          return <TanStackDevtools plugins={[
            { name: 'other', render: <OtherPlugin /> }
          ]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { OtherPlugin } from '@tanstack/other-plugin';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[
              { name: 'other', render: <OtherPlugin /> },
              {
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />
              }
            ]} />;
          }
        `),
      )
    })

    test('should create plugins prop if it does not exist', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should create plugins prop with other existing props', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools position="bottom-right" />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools position="bottom-right" plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should not add plugin if it already exists', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[
            { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> }
          ]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(false)
    })
  })

  describe('renamed named import pattern', () => {
    test('should handle renamed named import', () => {
      const code = `
        import { TanStackDevtools as DevtoolsPanel } from '@tanstack/react-devtools'
        
        function App() {
          return <DevtoolsPanel plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools as DevtoolsPanel } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <DevtoolsPanel plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should handle renamed import without plugins prop', () => {
      const code = `
        import { TanStackDevtools as MyDevtools } from '@tanstack/solid-devtools'
        
        function App() {
          return <MyDevtools />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools as MyDevtools } from '@tanstack/solid-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <MyDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })
  })

  describe('namespace import pattern', () => {
    test('should handle namespace import', () => {
      const code = `
        import * as DevtoolsModule from '@tanstack/react-devtools'
        
        function App() {
          return <DevtoolsModule.TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import * as DevtoolsModule from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <DevtoolsModule.TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should handle namespace import without plugins prop', () => {
      const code = `
        import * as TSD from '@tanstack/solid-devtools'
        
        function App() {
          return <TSD.TanStackDevtools />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/solid-router-devtools',
        'TanStack Router',
        {
          importName: 'SolidRouterDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import * as TSD from '@tanstack/solid-devtools';
          import { SolidRouterDevtoolsPanel } from "@tanstack/solid-router-devtools";
          
          function App() {
            return <TSD.TanStackDevtools plugins={[{
              name: "TanStack Router",
              render: <SolidRouterDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })
  })

  describe('different plugin types', () => {
    test('should handle router devtools', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-router-devtools',
        'TanStack Router',
        {
          importName: 'ReactRouterDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Router",
              render: <ReactRouterDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should handle form devtools', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/solid-devtools'
        
        function App() {
          return <TanStackDevtools />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'TanStack Form',
        {
          importName: 'ReactFormDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/solid-devtools';
          import { ReactFormDevtoolsPanel } from "@tanstack/react-form-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Form",
              render: <ReactFormDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })

    test('should handle query devtools', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/vue-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/vue-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          }
        `),
      )
    })
  })

  describe('edge cases', () => {
    test('should not transform files without TanStackDevtools component', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <div>Hello World</div>
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(false)
    })

    test('should handle TanStackDevtools with children', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return (
            <TanStackDevtools plugins={[]}>
              <div>Custom content</div>
            </TanStackDevtools>
          )
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]}>
              <div>Custom content</div>
            </TanStackDevtools>;
          }
        `),
      )
    })

    test('should handle multiple TanStackDevtools in same file', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return (
            <>
              <TanStackDevtools plugins={[]} />
              <TanStackDevtools plugins={[]} />
            </>
          )
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <>
              <TanStackDevtools plugins={[{
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />
              }]} />
              <TanStackDevtools plugins={[{
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />
              }]} />
            </>;
          }
        `),
      )
    })

    test('should handle TanStackDevtools deeply nested', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return (
            <div>
              <header>
                <nav>
                  <TanStackDevtools plugins={[]} />
                </nav>
              </header>
            </div>
          )
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <div>
              <header>
                <nav>
                  <TanStackDevtools plugins={[{
                    name: "TanStack Query",
                    render: <ReactQueryDevtoolsPanel />
                  }]} />
                </nav>
              </header>
            </div>;
          }
        `),
      )
    })

    test('should preserve existing code formatting and structure', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { useState } from 'react'
        
        function App() {
          const [count, setCount] = useState(0)
          
          return (
            <div>
              <button onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
              <TanStackDevtools />
            </div>
          )
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { useState } from 'react';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            const [count, setCount] = useState(0);
            return <div>
              <button onClick={() => setCount(count + 1)}>
                Count: {count}
              </button>
              <TanStackDevtools plugins={[{
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />
              }]} />
            </div>;
          }
        `),
      )
    })

    test('should handle TypeScript code', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import type { FC } from 'react'
        
        const App: FC = () => {
          return <TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import type { FC } from 'react';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          const App: FC = () => {
            return <TanStackDevtools plugins={[{
              name: "TanStack Query",
              render: <ReactQueryDevtoolsPanel />
            }]} />;
          };
        `),
      )
    })

    test('should handle plugins array with trailing comma', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[
            { name: 'other', render: <OtherPlugin /> },
          ]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[
              { name: 'other', render: <OtherPlugin /> },
              {
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />
              }
            ]} />;
          }
        `),
      )
    })

    test('should not transform if devtools import not found', () => {
      const code = `
        import { SomeOtherComponent } from 'some-package'
        
        function App() {
          return <SomeOtherComponent />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: 'ReactQueryDevtoolsPanel',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(false)
    })
  })

  describe('function-based plugins', () => {
    test('should add function plugin to empty plugins array', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'react-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[FormDevtoolsPlugin()]} />;
          }
        `),
      )
    })

    test('should add function plugin alongside JSX plugins', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[
            { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> }
          ]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'react-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
          import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[
              { name: 'TanStack Query', render: <ReactQueryDevtoolsPanel /> },
              FormDevtoolsPlugin()
            ]} />;
          }
        `),
      )
    })

    test('should create plugins prop with function plugin when it does not exist', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'react-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[FormDevtoolsPlugin()]} />;
          }
        `),
      )
    })

    test('should not add function plugin if it already exists', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { FormDevtoolsPlugin } from '@tanstack/react-form-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[FormDevtoolsPlugin()]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'react-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(false)
    })

    test('should handle function plugin with renamed devtools import', () => {
      const code = `
        import { TanStackDevtools as DevtoolsPanel } from '@tanstack/react-devtools'
        
        function App() {
          return <DevtoolsPanel plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-form-devtools',
        'react-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools as DevtoolsPanel } from '@tanstack/react-devtools';
          import { FormDevtoolsPlugin } from "@tanstack/react-form-devtools";
          
          function App() {
            return <DevtoolsPanel plugins={[FormDevtoolsPlugin()]} />;
          }
        `),
      )
    })

    test('should handle function plugin with namespace import', () => {
      const code = `
        import * as DevtoolsModule from '@tanstack/solid-devtools'
        
        function App() {
          return <DevtoolsModule.TanStackDevtools plugins={[]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/solid-form-devtools',
        'solid-form',
        {
          importName: 'FormDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import * as DevtoolsModule from '@tanstack/solid-devtools';
          import { FormDevtoolsPlugin } from "@tanstack/solid-form-devtools";
          
          function App() {
            return <DevtoolsModule.TanStackDevtools plugins={[FormDevtoolsPlugin()]} />;
          }
        `),
      )
    })

    test('should add multiple function plugins correctly', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        import { FormDevtoolsPlugin } from '@tanstack/react-form-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[FormDevtoolsPlugin()]} />
        }
      `

      const result = testTransform(
        code,
        '@tanstack/react-router-devtools',
        'react-router',
        {
          importName: 'RouterDevtoolsPlugin',
          type: 'function',
        },
      )

      expect(result.transformed).toBe(true)
      expect(removeEmptySpace(result.code)).toBe(
        removeEmptySpace(`
          import { TanStackDevtools } from '@tanstack/react-devtools';
          import { FormDevtoolsPlugin } from '@tanstack/react-form-devtools';
          import { RouterDevtoolsPlugin } from "@tanstack/react-router-devtools";
          
          function App() {
            return <TanStackDevtools plugins={[FormDevtoolsPlugin(), RouterDevtoolsPlugin()]} />;
          }
        `),
      )
    })

    test('should not transform when pluginImport is not provided', () => {
      const code = `
        import { TanStackDevtools } from '@tanstack/react-devtools'
        
        function App() {
          return <TanStackDevtools plugins={[]} />
        }
      `

      // No pluginImport provided - should return false
      const result = testTransform(
        code,
        '@tanstack/react-query-devtools',
        'TanStack Query',
        {
          importName: '',
          type: 'jsx',
        },
      )

      expect(result.transformed).toBe(false)
    })
  })
})
