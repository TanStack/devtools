import { A11yDevtoolsCore } from './A11yDevtoolsCore'
import type { A11yPluginOptions } from '../types'

/**
 * devtools-utils panel helpers require a no-arg constructor.
 * We bind initial options via a class factory.
 */
export function createA11yDevtoolsCoreClass(options: A11yPluginOptions = {}) {
  return class A11yDevtoolsCoreWithOptions extends A11yDevtoolsCore {
    constructor() {
      super(options)
    }
  }
}
