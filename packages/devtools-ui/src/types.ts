import type { ButtonWebComponentProps } from './components/button'
import type { CheckboxProps } from './components/checkbox'
import type { HeaderLogoProps, HeaderProps } from './components/header'
import type { InputProps } from './components/input'
import type { PanelProps } from './components/main-panel'
import type {
  SectionDescriptionProps,
  SectionIconProps,
  SectionProps,
  SectionTitleProps,
} from './components/section'
import type { SelectProps } from './components/select'
import type { TagProps } from './components/tag'
import type { JsonTreeWebComponentProps } from './components/tree'

export interface CustomElements {
  'tsd-json-tree': JsonTreeWebComponentProps
  'tsd-button': ButtonWebComponentProps
  'tsd-input': InputProps
  'tsd-section': SectionProps
  'tsd-section-title': SectionTitleProps
  'tsd-section-description': SectionDescriptionProps
  'tsd-section-icon': SectionIconProps
  'tsd-main-panel': PanelProps
  'tsd-checkbox': CheckboxProps
  'tsd-header': HeaderProps
  'tsd-header-logo': HeaderLogoProps
  'tsd-select': SelectProps<string | number>
  'tsd-tag': TagProps
}
