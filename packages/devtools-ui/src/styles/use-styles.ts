import * as goober from 'goober'
import { createSignal } from 'solid-js'
import { tokens } from './tokens'

const stylesFactory = () => {
  const { colors, font, size, alpha } = tokens
  const { fontFamily } = font
  const css = goober.css

  return {
    logo: css`
      cursor: pointer;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      border: none;
      width: ${size[12]};
      height: ${size[12]};
      font-family: ${fontFamily.sans};
      gap: ${tokens.size[0.5]};
      padding: 0px;
      &:hover {
        opacity: 0.7;
      }
    `,

    selectWrapper: css`
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    `,
    selectContainer: css`
      width: 100%;
    `,
    selectLabel: css`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${colors.gray[100]};
    `,
    selectDescription: css`
      font-size: 0.8rem;
      color: ${colors.gray[400]};
      margin: 0;
      line-height: 1.3;
    `,
    select: css`
      appearance: none;
      width: 100%;
      padding: 0.75rem 3rem 0.75rem 0.75rem;
      border-radius: 0.5rem;
      background-color: ${colors.darkGray[800]};
      color: ${colors.gray[100]};
      border: 1px solid ${colors.gray[700]};
      font-size: 0.875rem;
      transition: all 0.2s ease;
      cursor: pointer;

      /* Custom arrow */
      background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.25rem;

      &:hover {
        border-color: ${colors.gray[600]};
      }

      &:focus {
        outline: none;
        border-color: ${colors.purple[400]};
        box-shadow: 0 0 0 3px ${colors.purple[400]}${alpha[20]};
      }
    `,
    inputWrapper: css`
      width: 100%;
      max-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    `,
    inputContainer: css`
      width: 100%;
    `,
    inputLabel: css`
      font-size: 0.875rem;
      font-weight: 500;
      color: ${colors.gray[100]};
    `,
    inputDescription: css`
      font-size: 0.8rem;
      color: ${colors.gray[400]};
      margin: 0;
      line-height: 1.3;
    `,
    input: css`
      appearance: none;
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.5rem;
      background-color: ${colors.darkGray[800]};
      color: ${colors.gray[100]};
      border: 1px solid ${colors.gray[700]};
      font-size: 0.875rem;
      font-family: ${fontFamily.mono};
      transition: all 0.2s ease;

      &::placeholder {
        color: ${colors.gray[500]};
      }

      &:hover {
        border-color: ${colors.gray[600]};
      }

      &:focus {
        outline: none;
        border-color: ${colors.purple[400]};
        box-shadow: 0 0 0 3px ${colors.purple[400]}${alpha[20]};
      }
    `,
    checkboxWrapper: css`
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      user-select: none;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: ${colors.darkGray[800]};
      }
    `,
    checkboxContainer: css`
      width: 100%;
    `,
    checkboxLabelContainer: css`
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    `,
    checkbox: css`
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      border: 2px solid ${colors.gray[700]};
      border-radius: 0.375rem;
      background-color: ${colors.darkGray[800]};
      display: grid;
      place-items: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-top: 0.125rem;

      &:hover {
        border-color: ${colors.purple[400]};
      }

      &:checked {
        background-color: ${colors.purple[500]};
        border-color: ${colors.purple[500]};
      }

      &:checked::after {
        content: '';
        width: 0.4rem;
        height: 0.6rem;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-top: -3px;
      }
    `,
    checkboxLabel: css`
      color: ${colors.gray[100]};
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
    `,
    checkboxDescription: css`
      color: ${colors.gray[400]};
      font-size: 0.8rem;
      line-height: 1.3;
    `,
    tree: {
      valueString: css`
        color: ${colors.green[400]};
      `,
      valueNumber: css`
        color: ${colors.yellow[400]};
      `,
      valueBoolean: css`
        color: ${colors.pink[400]};
      `,
      valueNull: css`
        color: ${colors.gray[400]};
        font-style: italic;
      `,
      valueKey: css`
        color: ${colors.blue[300]};
      `,
      valueBraces: css`
        color: ${colors.gray[500]};
      `,
      valueContainer: (isRoot: boolean) => css`
        display: block;
        margin-left: ${isRoot ? '0' : '1rem'};
      `,
    },
  }
}

export function useStyles() {
  const [_styles] = createSignal(stylesFactory())
  return _styles
}
