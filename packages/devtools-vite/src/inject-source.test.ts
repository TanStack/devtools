import { describe, expect, it } from 'vitest'
import { addSourceToJsx } from './inject-source'

const removeEmptySpace = (str: string) => {
  return str.replace(/\s/g, '').trim()
}

describe('inject source', () => {
  it("shouldn't augment react fragments", () => {
    const output = addSourceToJsx(
      `
      export const Route = createFileRoute("/test")({
      component: function() { return <>Hello World</> },
      })
        `,
      'test.jsx',
    )
    expect(output).toBe(undefined)
  })

  it("shouldn't augment react fragments if they start with Fragment ", () => {
    const output = addSourceToJsx(
      `
      export const Route = createFileRoute("/test")({
      component: function() { return <Fragment>Hello World</Fragment> },
      })
        `,
      'test.jsx',
    )
    expect(output).toBe(undefined)
  })
  it("shouldn't augment react fragments if they start with React.Fragment ", () => {
    const output = addSourceToJsx(
      `
      export const Route = createFileRoute("/test")({
      component: function() { return <React.Fragment>Hello World</React.Fragment> },
      })
        `,
      'test.jsx',
    )
    expect(output).toBe(undefined)
  })
  describe('FunctionExpression', () => {
    it('should work with deeply nested custom JSX syntax', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const Route = createFileRoute("/test")({
      component: function() { return <div>Hello World</div> },
      })
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
            export const Route = createFileRoute("/test")({
      component: function() { return <div data-tsd-source="test.jsx:3:38">Hello World</div>; }
      });
        `),
      )
    })

    it('should work with props not destructured and spread', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: function(props) { return <div {...props}>Hello World</div> },
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props destructured and spread', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: function({...props}) { return <div {...props}>Hello World</div> },
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props destructured and spread with a different name', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: function({...rest}) { return <div {...rest}>Hello World</div> },
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props spread and other normal elements', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const Route = createFileRoute("/test")({
      component: function({...rest}) { return <div><div {...rest}>Hello World</div></div> } 
      })
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
            export const Route = createFileRoute("/test")({
      component: function({...rest}) { return <div data-tsd-source="test.jsx:3:47"><div {...rest}>Hello World</div></div>; }
      });
        `),
      )
    })
  })

  describe('ArrowFunctionExpression', () => {
    it('should work with deeply nested custom JSX syntax', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const Route = createFileRoute("/test")({
      component: () => <div>Hello World</div>,
      })
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
            export const Route = createFileRoute("/test")({
      component: () => <div data-tsd-source="test.jsx:3:24">Hello World</div>
      });
        `),
      )
    })

    it('should work with props not destructured and spread', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: (props) => <div {...props}>Hello World</div>,
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props destructured and spread', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: ({...props}) => <div {...props}>Hello World</div>,
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props destructured and spread with a different name', () => {
      const output = addSourceToJsx(
        `
      export const Route = createFileRoute("/test")({
      component: ({...rest}) => <div {...rest}>Hello World</div>, 
      })
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('should work with props spread and other normal elements', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const Route = createFileRoute("/test")({
      component: ({...rest}) => <div><div {...rest}>Hello World</div></div>, 
      })
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
            export const Route = createFileRoute("/test")({
      component: ({...rest}) => <div data-tsd-source="test.jsx:3:33"><div {...rest}>Hello World</div></div>
      });
        `),
      )
    })
  })
  describe('function declarations', () => {
    it('should not duplicate the same property if there are nested functions', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      function Parent({ ...props }) {
        function Child({ ...props }) {
          return <div   />
        }
        return <Child {...props} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
          function Parent({ ...props }) {
            function Child({ ...props }) {
              return <div data-tsd-source="test.jsx:4:18" />;
            }
            return <Child {...props} />;
          }
        `),
      )
    })
    it('should apply data-tsd-source from parent props if an external import', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
        
        import Custom from "external";

function test({...props })  {
  return <Custom children={props.children} />
}
  `,
          'test.tsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
          import Custom from "external";

function test({...props })  {
  return <Custom children={props.children} data-tsd-source="test.tsx:6:10" />;
}`),
      )
    })
    it(' props not destructured', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test(props){
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test(props) {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      }
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = addSourceToJsx(
        `
    function test(props) {
        return <button {...props} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test(props) {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test(props) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      }
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({...props}) {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({...props}) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      }
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured and name is different", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({...rest}) {
        return (<div>
         <button {...rest} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({...rest}) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...rest}  />
        </div>;
      }
`),
      )
    })

    it(' props destructured and collected with a different name', () => {
      const output = addSourceToJsx(
        `
    function test({ children, ...rest }) {
        return <button children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it(' props destructured and collected', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({ ...props }) {
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
    function test({ ...props }) {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      }
`),
      )
    })

    it('props destructured and collected with a different name even on custom components', () => {
      const output = addSourceToJsx(
        `
    function test({ children, ...rest }) {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('props destructured and collected even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({ ...props }) {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
    function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      }
`),
      )
    })

    it('props destructured and collected with a different name even on custom components even if exported', () => {
      const output = addSourceToJsx(
        `
      function test({ children, ...rest }) {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('props destructured and collected even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      function test({ ...props }) {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      }
`),
      )
    })
  })
  describe('variable declared functions', () => {
    it('works with function and props not destructured', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    const ButtonWithProps = function test(props){
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test(props) {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = addSourceToJsx(
        `
      const ButtonWithProps = function test(props) {
        return <button {...props} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test(props) {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test(props) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({...props}) {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({...props}) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured and name is different", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({...rest}) {
        return (<div>
         <button {...rest} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({...rest}) {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...rest}  />
        </div>;
      };
`),
      )
    })

    it(' props destructured and collected with a different name', () => {
      const output = addSourceToJsx(
        `
      const ButtonWithProps = function test({ children, ...rest }) {
        return <button children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it(' props destructured and collected', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({ ...props }) {
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = function test({ ...props }) {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it('props destructured and collected with a different name even on custom components', () => {
      const output = addSourceToJsx(
        `
      const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('props destructured and collected even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({ ...props }) {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it('props destructured and collected with a different name even on custom components even if exported', () => {
      const output = addSourceToJsx(
        `
      export const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('props destructured and collected even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const ButtonWithProps = function test({ ...props }) {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      export const ButtonWithProps = function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })
  })
  describe('arrow functions', () => {
    it('works with arrow function and props not destructured', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = (props) => {
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = (props) => {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = addSourceToJsx(
        `
      const ButtonWithProps = (props) => {
        return <button {...props} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = (props) => {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = (props) => {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({...props}) => {
        return (<div>
         <button {...props} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({...props}) => {
        return  <div data-tsd-source="test.jsx:3:17">
        <button {...props}  />
        </div>;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element but applies to other elements without any props even when props are destructured and name is different", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({...rest}) => {
        return (<div>
         <button {...rest} />
         </div>)
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({...rest}) => {
        return  <div data-tsd-source= "test.jsx:3:17">
        <button {...rest}  />
        </div>;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected with a different name', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({ children, ...rest }) => {
        return <button children={children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({ children, ...rest }) => {
        return <button  children={children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({ ...props }) => {
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = ({ ...props }) => {
        return <button  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected with a different name even on custom components', () => {
      const output = addSourceToJsx(
        `
      const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('works with arrow function and props destructured and collected even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({ ...props }) => {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = ({ ...props }) => {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected with a different name even on custom components even if exported', () => {
      const output = addSourceToJsx(
        `
      export const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton children={children} {...rest} />
      }
        `,
        'test.jsx',
      )
      expect(output).toBe(undefined)
    })

    it('works with arrow function and props destructured and collected even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const ButtonWithProps = ({ ...props }) => {
        return <CustomButton children={props.children} />
      }
        `,
          'test.jsx',
        )!.code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      export const ButtonWithProps = ({ ...props }) => {
        return <CustomButton  children={props.children} data-tsd-source="test.jsx:3:16" />;
      };
`),
      )
    })
  })

  describe('ignore patterns', () => {
    it('should skip injection for ignored component names (string)', () => {
      const output = addSourceToJsx(
        `
    function test() {
        return <Button />
      }
        `,
        'test.jsx',
        {
          components: ['Button'],
        },
      )
      expect(output).toBe(undefined)
    })

    it('should skip injection for ignored file paths (glob)', () => {
      const output = addSourceToJsx(
        `
    function test() {
        return <div />
      }
        `,
        'src/components/ignored-file.jsx',
        {
          files: ['**/ignored-file.jsx'],
        },
      )
      expect(output).toBe(undefined)
    })
  })
})
