import { createSignal } from 'solid-js'

export default function App() {
  const [showModal, setShowModal] = createSignal(false)

  return (
    <div style="padding: 20px; font-family: system-ui, sans-serif;">
      <h1>A11y Devtools Demo</h1>
      <p>
        This page contains intentional accessibility issues to demonstrate the
        A11y devtools plugin. Open the devtools panel and click "Run Audit" to
        see the issues.
      </p>

      <section style="margin-top: 24px;">
        <h2>Accessibility Issues Demo</h2>

        {/* Issue: Image without alt text */}
        <div style="margin-bottom: 16px;">
          <h3>1. Image without alt text</h3>
          <img
            src="https://via.placeholder.com/150"
            width={150}
            height={150}
            style="border: 1px solid #ccc;"
          />
        </div>

        {/* Issue: Button without accessible name */}
        <div style="margin-bottom: 16px;">
          <h3>2. Button without accessible name</h3>
          <button style="width: 40px; height: 40px; font-size: 20px;">
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {/* Issue: Form input without label */}
        <div style="margin-bottom: 16px;">
          <h3>3. Form input without label</h3>
          <input
            type="text"
            placeholder="Enter your name"
            style="padding: 8px;"
          />
        </div>

        {/* Issue: Low color contrast */}
        <div style="margin-bottom: 16px;">
          <h3>4. Low color contrast</h3>
          <p style="color: #aaa; background-color: #fff;">
            This text has poor color contrast and may be hard to read.
          </p>
        </div>

        {/* Issue: Link without discernible text */}
        <div style="margin-bottom: 16px;">
          <h3>5. Link without discernible text</h3>
          <a href="https://example.com" style="display: inline-block;">
            <img src="https://via.placeholder.com/24" width={24} height={24} />
          </a>
        </div>

        {/* Issue: Missing main landmark */}
        <div style="margin-bottom: 16px;">
          <h3>6. Click handler on non-interactive element</h3>
          <div
            onClick={() => setShowModal(true)}
            style="padding: 12px 24px; background-color: #0ea5e9; color: white; border-radius: 4px; display: inline-block; cursor: pointer;"
          >
            Click me (not a button!)
          </div>
        </div>

        {/* Issue: Empty heading */}
        <div style="margin-bottom: 16px;">
          <h3>7. Empty heading</h3>
          <h4></h4>
        </div>

        {/* Issue: Missing form labels */}
        <div style="margin-bottom: 16px;">
          <h3>8. Select without label</h3>
          <select style="padding: 8px;">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
      </section>

      <section style="margin-top: 32px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
        <h2>Accessible Content (for comparison)</h2>

        <div style="margin-bottom: 16px;">
          <h3>Proper image with alt text</h3>
          <img
            src="https://via.placeholder.com/150"
            alt="Placeholder image for demonstration"
            width={150}
            height={150}
            style="border: 1px solid #ccc;"
          />
        </div>

        <div style="margin-bottom: 16px;">
          <h3>Proper button with label</h3>
          <button
            aria-label="Close dialog"
            style="width: 40px; height: 40px; font-size: 20px;"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div style="margin-bottom: 16px;">
          <h3>Proper input with label</h3>
          <label for="name-input" style="display: block; margin-bottom: 4px;">
            Your Name
          </label>
          <input id="name-input" type="text" style="padding: 8px;" />
        </div>
      </section>

      {showModal() && (
        <div
          role="dialog"
          aria-labelledby="modal-title"
          style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 24px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 1000;"
        >
          <h2 id="modal-title">Modal Dialog</h2>
          <p>This is a modal that was triggered by a non-button element.</p>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      )}
    </div>
  )
}
