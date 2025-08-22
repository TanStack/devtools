import { describe, expect, it } from 'vitest'
import { addSourceToJsx } from '../src/inject-source'

const removeEmptySpace = (str: string) => {
  return str.replace(/\s/g, '').trim()
}

describe('inject source', () => {
  describe('function declarations', () => {
    it(' props not destructured', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test(props){
        return <button children={props.children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test(props) {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test(props) {
        return <button {...props} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test(props) {
        return <button {...props}  />
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test(props) {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({...props}) {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({...rest}) {
        return  <div data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:16"}>
        <button {...rest}  />
        </div>;
      }
`),
      )
    })

    it(' props destructured and collected with a different name', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({ children, ...rest }) {
        return <button children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({ children, ...rest }) {
        return <button  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
    function test({ ...props }) {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
    })

    it('props destructured and collected with a different name even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
    function test({ children, ...rest }) {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
function test({ children, ...rest }) {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
    function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
    })

    it('props destructured and collected with a different name even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      function test({ children, ...rest }) {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  function test({ children, ...rest }) {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test(props) {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test(props) {
        return <button {...props} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test(props) {
        return <button {...props}  />
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test(props) {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({...props}) {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({...rest}) {
        return  <div data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:16"}>
        <button {...rest}  />
        </div>;
      };
`),
      )
    })

    it(' props destructured and collected with a different name', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({ children, ...rest }) {
        return <button children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({ children, ...rest }) {
        return <button  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = function test({ ...props }) {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it('props destructured and collected with a different name even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it('props destructured and collected with a different name even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  export const ButtonWithProps = function test({ children, ...rest }) {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      export const ButtonWithProps = function test({ ...props }) {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = props => {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it("doesn't transform when props are spread across the element", () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = (props) => {
        return <button {...props} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = (props) => {
        return <button {...props}  />
      }
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = props => {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({...props}) => {
        return  <div data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({...rest}) => {
        return  <div data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:16"}>
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({ children, ...rest }) => {
        return <button  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = ({ ...props }) => {
        return <button  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected with a different name even on custom components', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      const ButtonWithProps = ({ ...props }) => {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })

    it('works with arrow function and props destructured and collected with a different name even on custom components even if exported', () => {
      const output = removeEmptySpace(
        addSourceToJsx(
          `
      export const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton children={children} />
      }
        `,
          'test.jsx',
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
  export const ButtonWithProps = ({ children, ...rest }) => {
        return <CustomButton  children={children} data-tsd-source={rest["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
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
        ).code,
      )
      expect(output).toBe(
        removeEmptySpace(`
      export const ButtonWithProps = ({ ...props }) => {
        return <CustomButton  children={props.children} data-tsd-source={props["data-tsd-source"] ?? "test.jsx:3:15"} />;
      };
`),
      )
    })
  })
})
