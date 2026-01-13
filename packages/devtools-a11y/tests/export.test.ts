import { describe, expect, it } from 'vitest'
import {
  exportToCsv,
  exportToJson,
  generateSummaryReport,
} from '../src'
import type { A11yAuditResult } from '../src'

const createMockResult = (): A11yAuditResult => ({
  issues: [
    {
      id: 'issue-1',
      ruleId: 'image-alt',
      impact: 'critical',
      message: 'Images must have alternate text',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
      wcagTags: ['wcag2a', 'wcag111'],
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
    {
      id: 'issue-2',
      ruleId: 'button-name',
      impact: 'serious',
      message: 'Buttons must have discernible text',
      help: 'Buttons must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/button-name',
      wcagTags: ['wcag2a', 'wcag412'],
      nodes: [
        {
          selector: 'button.submit',
          html: '<button class="submit"></button>',
          failureSummary: 'Add text or aria-label to the button',
        },
        {
          selector: 'button.cancel',
          html: '<button class="cancel"></button>',
          failureSummary: 'Add text or aria-label to the button',
        },
      ],
      meetsThreshold: true,
      timestamp: 1704067200000,
    },
  ],
  summary: {
    total: 2,
    critical: 1,
    serious: 1,
    moderate: 0,
    minor: 0,
    passes: 50,
    incomplete: 3,
  },
  timestamp: 1704067200000,
  url: 'http://localhost:3000/',
  context: 'document',
  duration: 123.45,
})

describe('export', () => {
  describe('exportToJson', () => {
    it('should export audit result to JSON format', () => {
      const result = createMockResult()
      const json = exportToJson(result)

      const parsed = JSON.parse(json)
      expect(parsed.meta).toBeDefined()
      expect(parsed.meta.url).toBe('http://localhost:3000/')
      expect(parsed.meta.context).toBe('document')
      expect(parsed.summary).toBeDefined()
      expect(parsed.summary.total).toBe(2)
      expect(parsed.issues).toHaveLength(2)
    })

    it('should include all issue details', () => {
      const result = createMockResult()
      const json = exportToJson(result)

      const parsed = JSON.parse(json)
      const firstIssue = parsed.issues[0]

      expect(firstIssue.ruleId).toBe('image-alt')
      expect(firstIssue.impact).toBe('critical')
      expect(firstIssue.helpUrl).toContain('dequeuniversity.com')
      expect(firstIssue.nodes).toHaveLength(1)
    })

    it('should include node details', () => {
      const result = createMockResult()
      const json = exportToJson(result)

      const parsed = JSON.parse(json)
      const node = parsed.issues[0].nodes[0]

      expect(node.selector).toBe('img.logo')
      expect(node.html).toContain('<img')
      expect(node.failureSummary).toBeDefined()
    })
  })

  describe('exportToCsv', () => {
    it('should export audit result to CSV format', () => {
      const result = createMockResult()
      const csv = exportToCsv(result)

      expect(csv).toContain('Rule ID')
      expect(csv).toContain('Impact')
      expect(csv).toContain('Message')
      expect(csv).toContain('Help URL')
      expect(csv).toContain('WCAG Tags')
      expect(csv).toContain('Selector')
      expect(csv).toContain('HTML')
    })

    it('should include one row per affected node', () => {
      const result = createMockResult()
      const csv = exportToCsv(result)

      const lines = csv.split('\n')
      // Header + 3 nodes (1 from issue 1 + 2 from issue 2)
      expect(lines).toHaveLength(4)
    })

    it('should escape quotes in content', () => {
      const result = createMockResult()
      const firstIssue = result.issues[0]
      if (firstIssue) {
        firstIssue.message = 'Message with "quotes" inside'
      }
      const csv = exportToCsv(result)

      expect(csv).toContain('""quotes""')
    })

    it('should join WCAG tags with semicolons', () => {
      const result = createMockResult()
      const csv = exportToCsv(result)

      expect(csv).toContain('wcag2a; wcag111')
    })
  })

  describe('generateSummaryReport', () => {
    it('should generate a human-readable summary', () => {
      const result = createMockResult()
      const report = generateSummaryReport(result)

      expect(report).toContain('ACCESSIBILITY AUDIT REPORT')
      expect(report).toContain('URL: http://localhost:3000/')
      expect(report).toContain('Total Issues: 2')
      expect(report).toContain('Critical: 1')
      expect(report).toContain('Serious: 1')
      expect(report).toContain('Passing Rules: 50')
    })

    it('should group issues by impact', () => {
      const result = createMockResult()
      const report = generateSummaryReport(result)

      expect(report).toContain('[CRITICAL]')
      expect(report).toContain('[SERIOUS]')
      expect(report).toContain('image-alt')
      expect(report).toContain('button-name')
    })

    it('should include selector and help URL', () => {
      const result = createMockResult()
      const report = generateSummaryReport(result)

      expect(report).toContain('Selector: img.logo')
      expect(report).toContain('Learn more: https://dequeuniversity.com')
    })

    it('should handle result with no issues', () => {
      const result: A11yAuditResult = {
        issues: [],
        summary: {
          total: 0,
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0,
          passes: 50,
          incomplete: 0,
        },
        timestamp: 1704067200000,
        url: 'http://localhost:3000/',
        context: 'document',
        duration: 50,
      }

      const report = generateSummaryReport(result)

      expect(report).toContain('Total Issues: 0')
      expect(report).not.toContain('[CRITICAL]')
      expect(report).not.toContain('[SERIOUS]')
    })
  })
})
