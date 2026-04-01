import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { pickSeverityClass, seoHealthTier, type SeoSeverity } from './seo-severity'
import type { SeoSectionSummary } from './seo-section-summary'

type JsonLdValue = Record<string, unknown>

type ValidationIssue = {
  severity: SeoSeverity
  message: string
}

type SchemaRule = {
  required: Array<string>
  recommended: Array<string>
  optional: Array<string>
}

type JsonLdEntry = {
  id: string
  raw: string
  parsed: JsonLdValue | Array<JsonLdValue> | null
  types: Array<string>
  issues: Array<ValidationIssue>
}

const SUPPORTED_RULES: Record<string, SchemaRule> = {
  WebSite: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['potentialAction'],
    optional: ['description', 'inLanguage'],
  },
  Organization: {
    required: ['@context', '@type', 'name', 'url'],
    recommended: ['logo', 'sameAs'],
    optional: ['description', 'email', 'telephone'],
  },
  Person: {
    required: ['@context', '@type', 'name'],
    recommended: ['url', 'sameAs'],
    optional: ['image', 'jobTitle', 'description'],
  },
  Article: {
    required: ['@context', '@type', 'headline', 'datePublished', 'author'],
    recommended: ['dateModified', 'image', 'mainEntityOfPage'],
    optional: ['description', 'publisher'],
  },
  Product: {
    required: ['@context', '@type', 'name'],
    recommended: ['image', 'description', 'offers'],
    optional: ['brand', 'sku', 'aggregateRating', 'review'],
  },
  BreadcrumbList: {
    required: ['@context', '@type', 'itemListElement'],
    recommended: [],
    optional: ['name'],
  },
  FAQPage: {
    required: ['@context', '@type', 'mainEntity'],
    recommended: [],
    optional: [],
  },
  LocalBusiness: {
    required: ['@context', '@type', 'name', 'address'],
    recommended: ['telephone', 'openingHours'],
    optional: ['geo', 'priceRange', 'url', 'sameAs', 'image'],
  },
}

const RESERVED_KEYS = new Set(['@context', '@type', '@id', '@graph'])

function isRecord(value: unknown): value is JsonLdValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTypeList(entity: JsonLdValue): Array<string> {
  const typeField = entity['@type']
  if (typeof typeField === 'string') return [typeField]
  if (Array.isArray(typeField)) {
    return typeField.filter((v): v is string => typeof v === 'string')
  }
  return []
}

function getEntities(payload: unknown): Array<JsonLdValue> {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord)
  }
  if (!isRecord(payload)) return []
  const graph = payload['@graph']
  if (Array.isArray(graph)) {
    const graphEntities = graph.filter(isRecord)
    if (graphEntities.length > 0) return graphEntities
  }
  return [payload]
}

function hasMissingKeys(entity: JsonLdValue, keys: Array<string>): Array<string> {
  return keys.filter((key) => {
    const value = entity[key]
    if (value === undefined || value === null) return true
    if (typeof value === 'string' && !value.trim()) return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  })
}

function validateContext(entity: JsonLdValue): Array<ValidationIssue> {
  const context = entity['@context']
  if (!context) {
    return [{ severity: 'error', message: 'Missing @context attribute.' }]
  }
  if (typeof context === 'string') {
    if (
      !context.includes('schema.org') &&
      context !== 'https://schema.org' &&
      context !== 'http://schema.org'
    ) {
      return [
        {
          severity: 'error',
          message: `Invalid @context value "${context}". Expected schema.org context.`,
        },
      ]
    }
    return []
  }
  return [
    {
      severity: 'error',
      message: 'Invalid @context type. Expected a string schema.org URL.',
    },
  ]
}

function validateTypes(entity: JsonLdValue): Array<ValidationIssue> {
  const types = getTypeList(entity)
  if (types.length === 0) {
    return [{ severity: 'error', message: 'Missing @type attribute.' }]
  }
  return []
}

function validateEntityByType(entity: JsonLdValue, typeName: string): Array<ValidationIssue> {
  const rules = SUPPORTED_RULES[typeName]
  if (!rules) {
    return [
      {
        severity: 'warning',
        message: `Type "${typeName}" has no dedicated validator yet.`,
      },
    ]
  }

  const issues: Array<ValidationIssue> = []
  const missingRequired = hasMissingKeys(entity, rules.required)
  const missingRecommended = hasMissingKeys(entity, rules.recommended)
  const missingOptional = hasMissingKeys(entity, rules.optional)

  if (missingRequired.length > 0) {
    issues.push({
      severity: 'error',
      message: `Missing required attributes: ${missingRequired.join(', ')}`,
    })
  }
  if (missingRecommended.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Missing recommended attributes: ${missingRecommended.join(', ')}`,
    })
  }
  if (missingOptional.length > 0) {
    issues.push({
      severity: 'info',
      message: `Missing optional attributes: ${missingOptional.join(', ')}`,
    })
  }

  const allowedSet = new Set([
    ...rules.required,
    ...rules.recommended,
    ...rules.optional,
    ...RESERVED_KEYS,
  ])
  const unknownKeys = Object.keys(entity).filter((key) => !allowedSet.has(key))
  if (unknownKeys.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Possible invalid attributes for ${typeName}: ${unknownKeys.join(', ')}`,
    })
  }

  return issues
}

function validateJsonLdValue(value: unknown): Array<ValidationIssue> {
  if (!isRecord(value) && !Array.isArray(value)) {
    return [
      {
        severity: 'error',
        message: 'JSON-LD root must be an object or an array of objects.',
      },
    ]
  }

  const entities = getEntities(value)
  if (entities.length === 0) {
    return [{ severity: 'error', message: 'No valid JSON-LD objects found.' }]
  }

  const issues: Array<ValidationIssue> = []
  for (const entity of entities) {
    issues.push(...validateContext(entity))
    issues.push(...validateTypes(entity))
    const types = getTypeList(entity)
    for (const typeName of types) {
      issues.push(...validateEntityByType(entity, typeName))
    }
  }
  return issues
}

function getTypeSummary(value: unknown): Array<string> {
  const entities = getEntities(value)
  const typeSet = new Set<string>()
  for (const entity of entities) {
    for (const type of getTypeList(entity)) {
      typeSet.add(type)
    }
  }
  return Array.from(typeSet)
}

export function analyzeJsonLdScripts(): Array<JsonLdEntry> {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  )

  return scripts.map((script, index) => {
    const raw = script.textContent?.trim() ?? ''
    if (!raw) {
      return {
        id: `jsonld-${index}`,
        raw,
        parsed: null,
        types: [],
        issues: [{ severity: 'error', message: 'Empty JSON-LD script block.' }],
      }
    }

    try {
      const parsed = JSON.parse(raw) as JsonLdValue | Array<JsonLdValue>
      return {
        id: `jsonld-${index}`,
        raw,
        parsed,
        types: getTypeSummary(parsed),
        issues: validateJsonLdValue(parsed),
      }
    } catch (error) {
      const parseMessage =
        error instanceof Error ? error.message : 'Unknown JSON parse error.'
      return {
        id: `jsonld-${index}`,
        raw,
        parsed: null,
        types: [],
        issues: [
          {
            severity: 'error',
            message: `Invalid JSON syntax: ${parseMessage}`,
          },
        ],
      }
    }
  })
}

/**
 * Flattens validation issues from all JSON-LD blocks for the SEO overview.
 */
export function getJsonLdPreviewSummary(): SeoSectionSummary {
  const entries = analyzeJsonLdScripts()
  if (entries.length === 0) {
    return {
      issues: [
        {
          severity: 'info',
          message: 'No JSON-LD scripts were detected on this page.',
        },
      ],
      hint: 'No blocks',
    }
  }
  const issues = entries.flatMap((entry) => entry.issues)
  return {
    issues,
    hint: `${entries.length} block(s)`,
  }
}

function getJsonLdScore(entries: Array<JsonLdEntry>): number {
  let errors = 0
  let warnings = 0

  for (const entry of entries) {
    for (const issue of entry.issues) {
      if (issue.severity === 'error') errors += 1
      if (issue.severity === 'warning') warnings += 1
    }
  }

  // Optional/info issues do not reduce score.
  const penalty = errors * 20 + warnings * 10
  return Math.max(0, 100 - penalty)
}

function JsonLdBlock(props: { entry: JsonLdEntry; index: number }) {
  const styles = useStyles()
  const s = styles()

  const copyParsed = async () => {
    if (!props.entry.parsed) return
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(props.entry.parsed, null, 2),
      )
    } catch {
      // ignore clipboard errors in restricted contexts
    }
  }

  const bulletClass = (sev: SeoSeverity) =>
    `${s.seoIssueBullet} ${pickSeverityClass(sev, {
      error: s.seoIssueBulletError,
      warning: s.seoIssueBulletWarning,
      info: s.seoIssueBulletInfo,
    })}`

  const badgeClass = (sev: SeoSeverity) =>
    `${s.seoIssueSeverityBadge} ${pickSeverityClass(sev, {
      error: s.seoIssueSeverityBadgeError,
      warning: s.seoIssueSeverityBadgeWarning,
      info: s.seoIssueSeverityBadgeInfo,
    })}`

  return (
    <div class={s.serpPreviewBlock}>
      <div class={s.seoJsonLdBlockHeaderRow}>
        <div>
          <div class={s.serpPreviewLabelSub}>Block #{props.index + 1}</div>
          <div class={s.seoJsonLdBlockTypes}>
            {props.entry.types.length > 0 ? props.entry.types.join(', ') : 'Unknown type'}
          </div>
        </div>
        <Show when={props.entry.parsed}>
          <button type="button" class={s.seoJsonLdCopyButton} onClick={copyParsed}>
            Copy
          </button>
        </Show>
      </div>

      <pre class={s.seoJsonLdPre}>
        {props.entry.parsed
          ? JSON.stringify(props.entry.parsed, null, 2)
          : props.entry.raw || 'No JSON-LD content found.'}
      </pre>

      <Show when={props.entry.issues.length > 0}>
        <ul class={`${s.seoIssueList} ${s.seoIssueListTopSpaced}`}>
          <For each={props.entry.issues}>
            {(issue) => (
              <li class={s.seoIssueRow}>
                <span class={bulletClass(issue.severity)}>●</span>
                <span class={s.seoIssueMessage}>{issue.message}</span>
                <span class={badgeClass(issue.severity)}>{issue.severity}</span>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={props.entry.issues.length === 0}>
        <div class={s.seoJsonLdOkLine}>✓ No validation issues</div>
      </Show>
    </div>
  )
}

export function JsonLdPreviewSection() {
  const entries = analyzeJsonLdScripts()
  const styles = useStyles()
  const score = getJsonLdScore(entries)
  const s = styles()
  const healthScoreClass = () => {
    const tier = seoHealthTier(score)
    return tier === 'good'
      ? s.seoHealthScoreGood
      : tier === 'fair'
        ? s.seoHealthScoreFair
        : s.seoHealthScorePoor
  }
  const healthRectClass = () => {
    const tier = seoHealthTier(score)
    return tier === 'good'
      ? s.seoHealthRectGood
      : tier === 'fair'
        ? s.seoHealthRectFair
        : s.seoHealthRectPoor
  }
  const errorCount = entries.reduce(
    (total, entry) =>
      total + entry.issues.filter((issue) => issue.severity === 'error').length,
    0,
  )
  const warningCount = entries.reduce(
    (total, entry) =>
      total + entry.issues.filter((issue) => issue.severity === 'warning').length,
    0,
  )

  return (
    <Section>
      <SectionDescription>
        Parses all <code>{`<script type="application/ld+json">`}</code> blocks on
        the page when you open this section, validates known schema types, and
        reports errors, warnings, and optional-field hints.
      </SectionDescription>
      <Show
        when={entries.length > 0}
        fallback={
          <div class={styles().seoMissingTagsSection}>
            No JSON-LD scripts were detected on this page.
          </div>
        }
      >
        <div class={s.seoJsonLdHealthCard}>
          <div class={s.seoHealthHeaderRow}>
            <span class={s.seoJsonLdHealthTitle}>JSON-LD Health</span>
            <span class={healthScoreClass()}>{score}%</span>
          </div>
          <div class={s.seoHealthTrack}>
            <svg
              class={s.seoHealthBarSvg}
              viewBox="0 0 100 5"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect
                class={healthRectClass()}
                x="0"
                y="0"
                width={Math.min(100, Math.max(0, score))}
                height="5"
                rx="2.5"
              />
            </svg>
          </div>
          <div class={s.seoHealthCountsRow}>
            <span class={s.seoHealthCountError}>
              {errorCount} error{errorCount === 1 ? '' : 's'}
            </span>
            <span class={s.seoHealthCountWarning}>
              {warningCount} warning{warningCount === 1 ? '' : 's'}
            </span>
            <span class={s.seoHealthCountInfo}>
              optional fields excluded from score
            </span>
          </div>
        </div>
        <For each={entries}>
          {(entry, index) => <JsonLdBlock entry={entry} index={index()} />}
        </For>
      </Show>
    </Section>
  )
}
