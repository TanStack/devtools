import { ChangeDetectionStrategy, Component, input } from '@angular/core'

@Component({
  selector: `demo-panel`,
  template: `
    <div data-testid="demo-plugin">demo plugin content</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoPanel {
  // Automatically added by the devtools host
  readonly theme = input<string>()
}
