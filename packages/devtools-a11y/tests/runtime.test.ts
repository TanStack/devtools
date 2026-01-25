// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/overlay', () => ({
  clearHighlights: vi.fn(),
  highlightAllIssues: vi.fn(),
  initOverlayAdapter: vi.fn(() => () => {}),
}))

vi.mock('../src/scanner', async () => {
  const actual = (await vi.importActual('../src/scanner')) as Record<
    string,
    unknown
  >
  return {
    ...actual,
    runAudit: vi.fn(),
  }
})

const createMockResult = () => ({
  issues: [
    {
      id: 'issue-1',
      ruleId: 'image-alt',
      impact: 'serious' as const,
      message: 'Images must have alternate text',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
      wcagTags: ['wcag2a'],
      nodes: [
        {
          selector: 'img.logo',
          html: '<img class="logo" src="logo.png">',
          failureSummary: 'Fix this issue by adding an alt attribute',
        },
      ],
      meetsThreshold: true,
      timestamp: 1704067200000,
    },
  ],
  summary: {
    total: 1,
    critical: 0,
    serious: 1,
    moderate: 0,
    minor: 0,
    passes: 0,
    incomplete: 0,
  },
  timestamp: 1704067200000,
  url: 'http://localhost:3000/',
  context: 'document',
  duration: 10,
})

describe('runtime scan overlays', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('clears highlights before running a new audit', async () => {
    const { getA11yRuntime } = await import('../src/runtime')
    const { runAudit } = await import('../src/scanner')
    const { clearHighlights } = await import('../src/overlay')

    vi.mocked(runAudit).mockResolvedValue(createMockResult())

    const runtime = getA11yRuntime({ showOverlays: true })

    await runtime.scan()

    const [clearOrder] = vi.mocked(clearHighlights).mock.invocationCallOrder
    const [auditOrder] = vi.mocked(runAudit).mock.invocationCallOrder

    expect(clearOrder).toBeDefined()
    expect(auditOrder).toBeDefined()
    expect(clearOrder!).toBeLessThan(auditOrder!)
  })
})
