import { For, Show } from 'solid-js'
import { Section, SectionDescription } from '@tanstack/devtools-ui'
import { useStyles } from '../../styles/use-styles'
import { pickSeverityClass, seoHealthTier } from './seo-severity'
import type { SeoSeverity } from './seo-severity'
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

/** Types that get field previews, structured validation, and expandable raw JSON. */
const JSON_LD_SUPPORTED_SCHEMA_TYPES: ReadonlyArray<string> = Object.keys(
  SUPPORTED_RULES,
).sort((a, b) => a.localeCompare(b))

function isSupportedSchemaType(typeName: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUPPORTED_RULES, typeName)
}

function entryUsesOnlySupportedTypes(entry: JsonLdEntry): boolean {
  if (!entry.parsed || entry.types.length === 0) return false
  return entry.types.every(isSupportedSchemaType)
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

function hasMissingKeys(
  entity: JsonLdValue,
  keys: Array<string>,
): Array<string> {
  return keys.filter((key) => {
    const value = entity[key]
    if (value === undefined || value === null) return true
    if (typeof value === 'string' && !value.trim()) return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  })
}

const VALID_SCHEMA_CONTEXTS = new Set([
  'https://schema.org',
  'http://schema.org',
  'https://schema.org/',
  'http://schema.org/',
])

function validateContext(entity: JsonLdValue): Array<ValidationIssue> {
  const context = entity['@context']
  if (!context) {
    return [{ severity: 'error', message: 'Missing @context attribute.' }]
  }
  if (typeof context === 'string') {
    if (!VALID_SCHEMA_CONTEXTS.has(context)) {
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

function validateEntityByType(
  entity: JsonLdValue,
  typeName: string,
): Array<ValidationIssue> {
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

function stringifyPreviewValue(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') {
    return value.length > maxLen ? `${value.slice(0, maxLen)}…` : value
  }
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)'
    if (value.length <= 3 && value.every((v) => typeof v === 'string')) {
      return value.join(', ')
    }
    if (value.length === 1 && isRecord(value[0])) {
      const o = value[0]
      const t = typeof o['@type'] === 'string' ? String(o['@type']) : 'Item'
      const label =
        typeof o.name === 'string'
          ? o.name
          : typeof o.headline === 'string'
            ? o.headline
            : ''
      return label ? `${t}: ${label}` : `${t} object`
    }
    return `${value.length} items`
  }
  if (isRecord(value)) {
    if (typeof value['@type'] === 'string' && (value.name ?? value.headline)) {
      const label =
        typeof value.name === 'string' ? value.name : String(value.headline)
      return `${value['@type']}: ${label}`
    }
    const json = JSON.stringify(value)
    return json.length > maxLen ? `${json.slice(0, maxLen)}…` : json
  }
  return String(value)
}

function getEntityPreviewRows(
  entity: JsonLdValue,
): Array<{ label: string; value: string }> {
  const types = getTypeList(entity)
  const typeForKeys = types.find(isSupportedSchemaType)
  if (!typeForKeys) return []
  const rules = SUPPORTED_RULES[typeForKeys]
  if (!rules) return []
  const orderedKeys = [
    ...rules.required,
    ...rules.recommended,
    ...rules.optional,
  ].filter(
    (k) => !k.startsWith('@') && entity[k] !== undefined && entity[k] !== null,
  )
  const seen = new Set<string>()
  const keys: Array<string> = []
  for (const k of orderedKeys) {
    if (seen.has(k)) continue
    seen.add(k)
    keys.push(k)
    if (keys.length >= 6) break
  }
  return keys.map((key) => ({
    label: key,
    value: stringifyPreviewValue(entity[key]),
  }))
}

function analyzeJsonLdScripts(): Array<JsonLdEntry> {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    ),
  )

  return scripts.map((script, index) => {
    const raw = script.textContent?.trim() || ''
    if (raw.length === 0) {
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
  const gaps = sumMissingSchemaFieldCounts(entries)
  const gapParts: Array<string> = []
  if (gaps.required > 0) gapParts.push(`${gaps.required} required`)
  if (gaps.recommended > 0) gapParts.push(`${gaps.recommended} recommended`)
  if (gaps.optional > 0) gapParts.push(`${gaps.optional} optional`)
  const gapHint = gapParts.length > 0 ? ` · Gaps: ${gapParts.join(', ')}` : ''

  return {
    issues,
    hint: `${entries.length} block(s)${gapHint}`,
  }
}

/**
 * Counts individual schema property names called out in missing-* validation messages.
 */
function sumMissingSchemaFieldCounts(entries: Array<JsonLdEntry>): {
  required: number
  recommended: number
  optional: number
} {
  const out = { required: 0, recommended: 0, optional: 0 }
  const rules: Array<{
    severity: SeoSeverity
    prefix: string
    key: keyof typeof out
  }> = [
    {
      severity: 'error',
      prefix: 'Missing required attributes:',
      key: 'required',
    },
    {
      severity: 'warning',
      prefix: 'Missing recommended attributes:',
      key: 'recommended',
    },
    {
      severity: 'info',
      prefix: 'Missing optional attributes:',
      key: 'optional',
    },
  ]

  for (const entry of entries) {
    for (const issue of entry.issues) {
      for (const r of rules) {
        if (issue.severity !== r.severity) continue
        if (!issue.message.startsWith(r.prefix)) continue
        const rest = issue.message.slice(r.prefix.length).trim()
        const n = rest
          ? rest
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean).length
          : 0
        out[r.key] += n
      }
    }
  }
  return out
}

/**
 * JSON-LD health 0–100: errors and warnings dominate; each info issue applies a
 * small penalty so optional-field gaps match how the SEO overview weights them.
 */
function getJsonLdScore(entries: Array<JsonLdEntry>): number {
  let errors = 0
  let warnings = 0
  let infos = 0

  for (const entry of entries) {
    for (const issue of entry.issues) {
      if (issue.severity === 'error') errors += 1
      else if (issue.severity === 'warning') warnings += 1
      else infos += 1
    }
  }

  const penalty = Math.min(100, errors * 20 + warnings * 10 + infos * 2)
  return Math.max(0, 100 - penalty)
}

function JsonLdEntityPreviewCard(props: { entity: JsonLdValue }) {
  const styles = useStyles()
  const s = styles()
  const header = getTypeList(props.entity).join(' · ') || 'Entity'
  const rows = getEntityPreviewRows(props.entity)

  return (
    <div class={s.seoJsonLdEntityCard}>
      <div class={s.seoJsonLdEntityCardHeader}>{header}</div>
      <Show
        when={rows.length > 0}
        fallback={
          <div class={s.seoJsonLdEntityCardRows}>
            <span class={s.seoJsonLdEntityCardValue}>
              (no fields to preview)
            </span>
          </div>
        }
      >
        <div class={s.seoJsonLdEntityCardRows}>
          <For each={rows}>
            {(row) => (
              <div class={s.seoJsonLdEntityCardRow}>
                <span class={s.seoJsonLdEntityCardKey}>{row.label}</span>
                <span class={s.seoJsonLdEntityCardValue}>{row.value}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
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

  const showPreview =
    entryUsesOnlySupportedTypes(props.entry) && props.entry.parsed !== null

  return (
    <div class={s.serpPreviewBlock}>
      <div class={s.seoJsonLdBlockHeaderRow}>
        <div>
          <div class={s.serpPreviewLabelSub}>Block #{props.index + 1}</div>
          <div class={s.seoJsonLdBlockTypes}>
            {props.entry.types.length > 0
              ? props.entry.types.join(', ')
              : 'Unknown type'}
            {showPreview ? <span> · preview</span> : <span> · raw JSON</span>}
          </div>
        </div>
        <Show when={props.entry.parsed}>
          <button
            type="button"
            class={s.seoJsonLdCopyButton}
            onClick={copyParsed}
          >
            Copy
          </button>
        </Show>
      </div>

      <Show
        when={showPreview}
        fallback={
          <pre class={s.seoJsonLdPre}>
            {props.entry.parsed
              ? JSON.stringify(props.entry.parsed, null, 2)
              : props.entry.raw || 'No JSON-LD content found.'}
          </pre>
        }
      >
        <div class={s.seoJsonLdCardGrid}>
          <For each={getEntities(props.entry.parsed!)}>
            {(entity) => <JsonLdEntityPreviewCard entity={entity} />}
          </For>
        </div>
        <details class={s.seoJsonLdRawDetails}>
          <summary class={s.seoJsonLdRawSummary}>Raw JSON</summary>
          <pre class={s.seoJsonLdPre}>
            {JSON.stringify(props.entry.parsed, null, 2)}
          </pre>
        </details>
      </Show>

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
  const fieldGaps = sumMissingSchemaFieldCounts(entries)
  const healthScoreClass = () => {
    const tier = seoHealthTier(score)
    return tier === 'good'
      ? s.seoHealthScoreGood
      : tier === 'fair'
        ? s.seoHealthScoreFair
        : s.seoHealthScorePoor
  }
  const healthFillClass = () => {
    const tier = seoHealthTier(score)
    const tierFill =
      tier === 'good'
        ? s.seoHealthFillGood
        : tier === 'fair'
          ? s.seoHealthFillFair
          : s.seoHealthFillPoor
    return `${s.seoHealthFill} ${tierFill}`
  }
  const errorCount = entries.reduce(
    (total, entry) =>
      total + entry.issues.filter((issue) => issue.severity === 'error').length,
    0,
  )
  const warningCount = entries.reduce(
    (total, entry) =>
      total +
      entry.issues.filter((issue) => issue.severity === 'warning').length,
    0,
  )
  const infoCount = entries.reduce(
    (total, entry) =>
      total + entry.issues.filter((issue) => issue.severity === 'info').length,
    0,
  )
  const progressAriaLabel = (() => {
    const parts = [`JSON-LD health ${Math.round(score)} percent`]
    const sev = [
      errorCount && `${errorCount} error${errorCount === 1 ? '' : 's'}`,
      warningCount && `${warningCount} warning${warningCount === 1 ? '' : 's'}`,
      infoCount && `${infoCount} info`,
    ].filter(Boolean)
    if (sev.length) parts.push(sev.join(', '))
    const gapBits: Array<string> = []
    if (fieldGaps.required > 0)
      gapBits.push(
        `${fieldGaps.required} required field${fieldGaps.required === 1 ? '' : 's'}`,
      )
    if (fieldGaps.recommended > 0)
      gapBits.push(
        `${fieldGaps.recommended} recommended field${fieldGaps.recommended === 1 ? '' : 's'}`,
      )
    if (fieldGaps.optional > 0)
      gapBits.push(
        `${fieldGaps.optional} optional field${fieldGaps.optional === 1 ? '' : 's'}`,
      )
    if (gapBits.length) parts.push(`Missing: ${gapBits.join(', ')}`)
    return parts.join('. ')
  })()
  const missingFieldsLine = (() => {
    const bits: Array<string> = []
    if (fieldGaps.required > 0) bits.push(`${fieldGaps.required} required`)
    if (fieldGaps.recommended > 0)
      bits.push(`${fieldGaps.recommended} recommended`)
    if (fieldGaps.optional > 0) bits.push(`${fieldGaps.optional} optional`)
    if (bits.length === 0) return null
    return `Missing schema fields: ${bits.join(' · ')}`
  })()

  return (
    <Section>
      <SectionDescription>
        Reads every <code>{`<script type="application/ld+json">`}</code> block
        when you open this section. Blocks where every <code>@type</code> is in
        the list below get compact preview cards and expandable raw JSON; any
        other <code>@type</code> uses the full JSON view so you can inspect and
        copy it as before. Validation messages still apply in both cases.
      </SectionDescription>
      <div class={s.seoJsonLdSupportedIntro}>
        <span class={s.seoJsonLdSupportedIntroLabel}>
          Supported schema types
        </span>
        <div class={s.seoJsonLdSupportedChips}>
          <For each={[...JSON_LD_SUPPORTED_SCHEMA_TYPES]}>
            {(name) => <span class={s.seoJsonLdSupportedChip}>{name}</span>}
          </For>
        </div>
      </div>
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
          <div
            class={s.seoHealthTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(score)}
            aria-label={progressAriaLabel}
          >
            <div
              class={healthFillClass()}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <div class={s.seoHealthCountsRow}>
            <span class={s.seoHealthCountError}>
              {errorCount} error{errorCount === 1 ? '' : 's'}
            </span>
            <span class={s.seoHealthCountWarning}>
              {warningCount} warning{warningCount === 1 ? '' : 's'}
            </span>
            <span class={s.seoHealthCountInfo}>
              {infoCount} info{infoCount === 1 ? '' : 's'} (2 pts each)
            </span>
          </div>
          <Show when={missingFieldsLine}>
            <div class={s.seoJsonLdHealthMissingLine}>{missingFieldsLine}</div>
          </Show>
        </div>
        <For each={entries}>
          {(entry, index) => <JsonLdBlock entry={entry} index={index()} />}
        </For>
      </Show>
    </Section>
  )
}
