export function A11yAuditFixture() {
  return (
    <section
      data-testid="a11y-audit-fixture"
      aria-label="Accessibility audit fixture"
      className="a11y-audit-fixture"
    >
      {/* prettier-ignore */}
      <img data-testid="a11y-image-alt" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
      <button data-testid="a11y-button-name" type="button" />
      <input data-testid="a11y-label" type="text" />
    </section>
  )
}
