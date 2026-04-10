import * as goober from 'goober'
import { createMemo } from 'solid-js'
import { useTheme } from '@tanstack/devtools-ui'
import { tokens } from './tokens'

import type { TanStackDevtoolsTheme } from '@tanstack/devtools-ui'

function createSeoStyles(theme: TanStackDevtoolsTheme) {
  const { colors, font } = tokens
  const { fontFamily } = font
  const css = goober.css
  const t = (light: string, dark: string) => (theme === 'light' ? light : dark)

  return {
    seoTabContainer: css`
      padding: 0;
      margin: 0 auto;
      background: ${t(colors.white, colors.darkGray[700])};
      border-radius: 8px;
      box-shadow: none;
      overflow-y: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      overflow-y: auto;
    `,
    seoTabTitle: css`
      font-size: 1.25rem;
      font-weight: 600;
      color: ${t(colors.gray[900], colors.gray[100])};
      margin: 0;
      padding: 1rem 1.5rem 0.5rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    seoTabSection: css`
      padding: 1.5rem;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-radius: 0.75rem;
    `,
    seoSubNav: css`
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 0;
      margin-bottom: 1rem;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
      min-width: 0;

      @media (max-width: 1024px) {
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;

        &::after {
          content: '';
          flex-shrink: 0;
          width: max(20px, env(safe-area-inset-right, 0px));
          align-self: stretch;
        }

        &::-webkit-scrollbar {
          height: 5px;
        }

        &::-webkit-scrollbar-track {
          background: ${t(colors.gray[100], colors.gray[800])};
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: ${t(colors.gray[300], colors.gray[600])};
          border-radius: 4px;
        }
      }
    `,
    seoSubNavLabel: css`
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: ${t(colors.gray[600], colors.gray[400])};
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      &:hover {
        color: ${t(colors.gray[800], colors.gray[200])};
      }
    `,
    seoSubNavLabelActive: css`
      color: ${t(colors.gray[900], colors.gray[100])};
      border-bottom-color: ${t(colors.gray[900], colors.gray[100])};
    `,
    seoPreviewSection: css`
      display: flex;
      flex-direction: row;
      gap: 16px;
      margin-bottom: 0;
      justify-content: flex-start;
      align-items: flex-start;
      overflow-x: auto;
      flex-wrap: wrap;
      padding-bottom: 0.5rem;
    `,
    seoPreviewCard: css`
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      padding: 12px 10px;
      background: ${t(colors.white, colors.darkGray[900])};
      margin-bottom: 0;
      box-shadow: 0 1px 3px ${t('rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)')};
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      min-width: 200px;
      max-width: 240px;
      font-size: 0.95rem;
      gap: 4px;
    `,
    seoPreviewHeader: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    seoPreviewImage: css`
      max-width: 100%;
      border-radius: 6px;
      margin-bottom: 6px;
      box-shadow: 0 1px 2px ${t('rgba(0,0,0,0.03)', 'rgba(0,0,0,0.06)')};
      height: 160px;
      object-fit: cover;
    `,
    seoPreviewTitle: css`
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 4px;
      color: ${t(colors.gray[900], colors.gray[100])};
    `,
    seoPreviewDesc: css`
      color: ${t(colors.gray[600], colors.gray[400])};
      margin-bottom: 4px;
      font-size: 0.8rem;
    `,
    seoPreviewUrl: css`
      color: ${t(colors.gray[500], colors.gray[500])};
      font-size: 0.75rem;
      margin-bottom: 0;
      word-break: break-all;
    `,
    seoMissingTagsSection: css`
      margin-top: 4px;
      font-size: 0.875rem;
      color: ${t(colors.red[500], colors.red[400])};
    `,
    seoMissingTagsList: css`
      margin: 4px 0 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 240px;
    `,
    seoMissingTag: css`
      background: ${t(colors.red[100], colors.red[500] + '22')};
      color: ${t(colors.red[700], colors.red[500])};
      border-radius: 3px;
      padding: 2px 6px;
      font-size: 0.75rem;
      font-weight: 500;
    `,
    seoAllTagsFound: css`
      color: ${t(colors.green[700], colors.green[500])};
      font-weight: 500;
      margin-left: 0;
      padding: 0 10px 8px 10px;
      font-size: 0.875rem;
    `,
    serpPreviewBlock: css`
      margin-bottom: 1.5rem;
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 10px;
      padding: 1rem;
    `,
    serpPreviewLabel: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    serpSnippet: css`
      border: 1px solid ${t(colors.gray[100], colors.gray[800])};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${t(colors.white, colors.darkGray[900])};
      max-width: 620px;
      font-family: ${fontFamily.sans};
      box-shadow: 0 1px 2px ${t('rgba(0,0,0,0.04)', 'rgba(0,0,0,0.08)')};
    `,
    serpSnippetMobile: css`
      border: 1px solid ${t(colors.gray[100], colors.gray[800])};
      border-radius: 8px;
      padding: 1rem 1.25rem;
      background: ${t(colors.white, colors.darkGray[900])};
      max-width: 328px;
      font-family: ${fontFamily.sans};
      box-shadow: 0 1px 2px ${t('rgba(0,0,0,0.04)', 'rgba(0,0,0,0.08)')};
    `,
    serpSnippetDescMobile: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    `,
    serpSnippetTopRow: css`
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    `,
    serpSnippetFavicon: css`
      width: 28px;
      height: 28px;
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: contain;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    serpSnippetDefaultFavicon: css`
      width: 28px;
      height: 28px;
      background-color: ${t(colors.gray[200], colors.gray[800])};
      border-radius: 50%;
      flex-shrink: 0;
      object-fit: contain;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    serpSnippetSiteColumn: css`
      display: flex;
      flex-direction: column;
      gap: 0;
      min-width: 0;
    `,
    serpSnippetSiteName: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.4;
      margin: 0;
    `,
    serpSnippetSiteUrl: css`
      font-size: 0.75rem;
      color: ${t(colors.gray[500], colors.gray[500])};
      line-height: 1.4;
      margin: 0;
    `,
    serpSnippetTitle: css`
      font-size: 1.25rem;
      font-weight: 400;
      color: ${t('#1a0dab', '#8ab4f8')};
      margin: 0 0 4px 0;
      line-height: 1.3;
    `,
    serpSnippetDesc: css`
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
      margin: 0;
      line-height: 1.5;
    `,
    serpMeasureHidden: css`
      position: absolute;
      left: -9999px;
      top: 0;
      visibility: hidden;
      pointer-events: none;
      box-sizing: border-box;
    `,
    serpMeasureHiddenMobile: css`
      position: absolute;
      left: -9999px;
      top: 0;
      width: 340px;
      visibility: hidden;
      pointer-events: none;
      font-size: 0.875rem;
      line-height: 1.5;
    `,
    serpReportSection: css`
      margin-top: 1rem;
      font-size: 0.875rem;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    serpErrorList: css`
      margin: 4px 0 0 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    `,
    serpReportItem: css`
      margin-top: 0.25rem;
      color: ${t(colors.red[700], colors.red[400])};
      font-size: 0.875rem;
    `,
    seoIssueList: css`
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    `,
    seoIssueListNested: css`
      margin: 6px 0 0 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
    `,
    seoIssueRow: css`
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 0.875rem;
      line-height: 1.45;
    `,
    seoIssueRowCompact: css`
      display: flex;
      gap: 6px;
      align-items: flex-start;
      font-size: 0.6875rem;
      line-height: 1.45;
    `,
    seoIssueBullet: css`
      flex-shrink: 0;
      padding-top: 1px;
    `,
    /** Default foreground for SEO issue copy (no layout). */
    seoIssueText: css`
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoIssueMessage: css`
      flex: 1;
      min-width: 0;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoIssueSeverityBadge: css`
      flex-shrink: 0;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
      padding-top: 2px;
    `,
    seoMetaRow: css`
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 0.75rem;
      padding: 5px 0;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
    `,
    seoMetaRowLabel: css`
      min-width: 130px;
      flex-shrink: 0;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoMetaRowValue: css`
      word-break: break-all;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoIssueBulletError: css`
      color: #dc2626;
    `,
    seoIssueBulletWarning: css`
      color: #d97706;
    `,
    seoIssueBulletInfo: css`
      color: #2563eb;
    `,
    seoIssueSeverityBadgeError: css`
      color: #dc2626;
    `,
    seoIssueSeverityBadgeWarning: css`
      color: #d97706;
    `,
    seoIssueSeverityBadgeInfo: css`
      color: #2563eb;
    `,
    seoChipRow: css`
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    `,
    seoPill: css`
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
    `,
    seoPillNeutral: css`
      background: ${t(colors.gray[100], colors.gray[800] + '40')};
      color: ${t(colors.gray[600], colors.gray[400])};
    `,
    seoPillMuted: css`
      background: ${t(colors.gray[200], '#6b728018')};
      color: ${t(colors.gray[600], '#9ca3af')};
    `,
    seoPillInternal: css`
      background: ${t(colors.gray[200], '#6b728018')};
      color: ${t(colors.gray[700], '#6b7280')};
    `,
    seoPillBlue: css`
      background: ${t(colors.blue[50], '#3b82f618')};
      color: ${t(colors.blue[700], '#3b82f6')};
    `,
    seoPillAmber: css`
      background: ${t(colors.yellow[50], '#d9770618')};
      color: ${t(colors.yellow[700], '#d97706')};
    `,
    seoPillRed: css`
      background: ${t(colors.red[50], '#dc262618')};
      color: ${t(colors.red[700], '#dc2626')};
    `,
    seoLinksReportItem: css`
      padding: 8px 0;
      border-bottom: 1px solid ${t(colors.gray[200], colors.gray[800])};
      &:last-child {
        border-bottom: none;
      }
    `,
    seoLinksReportTopRow: css`
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    `,
    seoLinkKindBadge: css`
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.03em;
      flex-shrink: 0;
    `,
    seoLinkKindInternal: css`
      background: ${t(colors.gray[200], '#6b728018')};
      color: ${t(colors.gray[700], '#6b7280')};
    `,
    seoLinkKindExternal: css`
      background: ${t(colors.blue[50], '#3b82f618')};
      color: ${t(colors.blue[700], '#3b82f6')};
    `,
    seoLinkKindNonWeb: css`
      background: ${t(colors.yellow[50], '#d9770618')};
      color: ${t(colors.yellow[700], '#d97706')};
    `,
    seoLinkKindInvalid: css`
      background: ${t(colors.red[50], '#dc262618')};
      color: ${t(colors.red[700], '#dc2626')};
    `,
    seoLinksAnchorText: css`
      font-size: 12px;
      font-weight: 500;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoLinksHrefLine: css`
      font-size: 11px;
      color: ${t(colors.gray[500], colors.gray[400])};
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      padding-left: 2px;
    `,
    seoLinksAccordion: css`
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    `,
    seoLinksAccordionSection: css`
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      overflow: hidden;
      background: ${t(colors.white, colors.darkGray[900])};
    `,
    seoLinksAccordionTrigger: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 10px;
      padding: 8px 10px;
      border: none;
      background: ${t(colors.gray[50], colors.darkGray[800])};
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      color: ${t(colors.gray[900], colors.gray[100])};
      font-size: 12px;
      font-weight: 600;
      &:hover {
        background: ${t(colors.gray[100], colors.darkGray[700])};
      }
    `,
    seoLinksAccordionTriggerLeft: css`
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    `,
    seoLinksAccordionChevron: css`
      flex-shrink: 0;
      font-size: 10px;
      line-height: 1;
      color: ${t(colors.gray[500], colors.gray[500])};
      transition: transform 0.15s ease;
    `,
    seoLinksAccordionChevronOpen: css`
      transform: rotate(90deg);
    `,
    seoLinksAccordionPanel: css`
      border-top: 1px solid ${t(colors.gray[200], colors.gray[800])};
      padding: 2px 10px 6px;
    `,
    seoLinksAccordionInnerList: css`
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0;
    `,
    seoHealthHeaderRow: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    `,
    seoHealthLabelMuted: css`
      font-size: 12px;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoHealthScoreGood: css`
      font-size: 13px;
      font-weight: 600;
      color: #16a34a;
    `,
    seoHealthScoreFair: css`
      font-size: 13px;
      font-weight: 600;
      color: #d97706;
    `,
    seoHealthScorePoor: css`
      font-size: 13px;
      font-weight: 600;
      color: #dc2626;
    `,
    seoHealthTrack: css`
      width: 100%;
      height: 10px;
      border-radius: 999px;
      background: ${t(colors.gray[100], colors.gray[800])};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      overflow: hidden;
      box-shadow: inset 0 1px 2px
        ${t('rgba(15, 23, 42, 0.06)', 'rgba(0, 0, 0, 0.35)')};
    `,
    seoHealthFill: css`
      height: 100%;
      min-width: 0;
      max-width: 100%;
      border-radius: 999px;
      transition: width 0.45s cubic-bezier(0.33, 1, 0.68, 1);
      box-shadow: 0 1px 2px
        ${t('rgba(15, 23, 42, 0.12)', 'rgba(0, 0, 0, 0.25)')};
    `,
    seoHealthFillGood: css`
      background: linear-gradient(
        90deg,
        ${t(colors.green[700], '#15803d')} 0%,
        ${t(colors.green[500], '#22c55e')} 100%
      );
    `,
    seoHealthFillFair: css`
      background: linear-gradient(
        90deg,
        ${t(colors.yellow[700], '#b45309')} 0%,
        ${t(colors.yellow[500], '#eab308')} 100%
      );
    `,
    seoHealthFillPoor: css`
      background: linear-gradient(
        90deg,
        ${t(colors.red[700], '#b91c1c')} 0%,
        ${t(colors.red[500], '#ef4444')} 100%
      );
    `,
    seoHealthCountsRow: css`
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 11px;
    `,
    seoHealthCountError: css`
      color: #dc2626;
    `,
    seoHealthCountWarning: css`
      color: #d97706;
    `,
    seoHealthCountInfo: css`
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoJsonLdHealthMissingLine: css`
      margin-top: 6px;
      font-size: 11px;
      line-height: 1.4;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoOverviewPillsRow: css`
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    `,
    seoPillStatusOk: css`
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: ${t(colors.green[50], '#16a34a18')};
      color: ${t(colors.green[700], '#16a34a')};
    `,
    seoPillStatusWarn: css`
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: ${t(colors.yellow[50], '#d9770618')};
      color: ${t(colors.yellow[700], '#d97706')};
    `,
    seoPillStatusBad: css`
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: ${t(colors.red[50], '#dc262618')};
      color: ${t(colors.red[700], '#dc2626')};
    `,
    seoPillMetaCount: css`
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: ${t(colors.gray[100], colors.gray[800] + '40')};
      color: ${t(colors.gray[600], '#9ca3af')};
    `,
    seoOverviewCheckListCaption: css`
      margin: 0 0 8px 0;
      font-size: 11px;
      line-height: 1.4;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoOverviewScoreRingWrap: css`
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    `,
    seoOverviewScoreRingSvg: css`
      display: block;
    `,
    seoOverviewScoreRingTrack: css`
      fill: none;
      stroke: ${t(colors.gray[200], colors.gray[700])};
      stroke-width: 3;
    `,
    seoOverviewScoreRingLabel: css`
      font-size: 10px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      font-family: ${fontFamily.sans};
      fill: ${t(colors.gray[800], colors.gray[100])};
    `,
    seoOverviewCheckList: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      border-radius: 8px;
      overflow: hidden;
    `,
    seoOverviewCheckRow: css`
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      margin: 0;
      padding: 9px 10px;
      text-align: left;
      border: none;
      border-bottom: 1px solid ${t(colors.gray[100], colors.gray[800])};
      background: ${t(colors.white, colors.darkGray[900])};
      color: ${t(colors.gray[900], colors.gray[100])};
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.1s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: ${t(colors.gray[50], colors.gray[800] + '55')};
      }

      &:focus {
        outline: none;
      }

      &:focus-visible {
        position: relative;
        z-index: 1;
        box-shadow: inset 0 0 0 2px ${t(colors.blue[500], colors.blue[400])};
      }
    `,
    seoOverviewCheckBody: css`
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    `,
    seoOverviewCheckTitle: css`
      font-weight: 500;
      font-size: 13px;
      line-height: 1.3;
    `,
    seoOverviewCheckMeta: css`
      font-size: 11px;
      line-height: 1.35;
      color: ${t(colors.gray[500], colors.gray[400])};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `,
    seoOverviewCheckCounts: css`
      flex-shrink: 0;
      font-family: ${fontFamily.mono};
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      line-height: 1.3;
      letter-spacing: -0.02em;
    `,
    seoOverviewCheckNError: css`
      color: #dc2626;
      font-weight: 500;
    `,
    seoOverviewCheckNWarn: css`
      color: #d97706;
      font-weight: 500;
    `,
    seoOverviewCheckNInfo: css`
      color: ${t(colors.blue[600], colors.blue[400])};
      font-weight: 500;
    `,
    seoOverviewCheckNZero: css`
      color: ${t(colors.gray[400], colors.gray[600])};
      font-weight: 400;
    `,
    seoOverviewCheckNSep: css`
      color: ${t(colors.gray[300], colors.gray[600])};
      margin: 0 1px;
      font-weight: 400;
    `,
    seoOverviewCheckChevron: css`
      flex-shrink: 0;
      color: ${t(colors.gray[400], colors.gray[500])};
      font-size: 15px;
      line-height: 1.2;
    `,
    seoHeadingTreeHeaderRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    `,
    serpPreviewLabelFlat: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    seoHeadingTreeCount: css`
      font-size: 11px;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoHeadingTreeList: css`
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
    `,
    seoHeadingTreeItem: css`
      display: flex;
      gap: 8px;
      align-items: baseline;
    `,
    seoHeadingTreeIndent1: css`
      padding-left: 0;
    `,
    seoHeadingTreeIndent2: css`
      padding-left: 14px;
    `,
    seoHeadingTreeIndent3: css`
      padding-left: 28px;
    `,
    seoHeadingTreeIndent4: css`
      padding-left: 42px;
    `,
    seoHeadingTreeIndent5: css`
      padding-left: 56px;
    `,
    seoHeadingTreeIndent6: css`
      padding-left: 70px;
    `,
    seoHeadingTag: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 26px;
      height: 16px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.03em;
      flex-shrink: 0;
      font-family: monospace, ui-monospace, monospace;
    `,
    seoHeadingTagL1: css`
      background: #60a5fa18;
      color: #60a5fa;
    `,
    seoHeadingTagL2: css`
      background: #34d39918;
      color: #34d399;
    `,
    seoHeadingTagL3: css`
      background: #a78bfa18;
      color: #a78bfa;
    `,
    seoHeadingTagL4: css`
      background: #f59e0b18;
      color: #f59e0b;
    `,
    seoHeadingTagL5: css`
      background: #f8717118;
      color: #f87171;
    `,
    seoHeadingTagL6: css`
      background: #94a3b818;
      color: #94a3b8;
    `,
    seoHeadingLineText: css`
      font-size: 12px;
      font-style: normal;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoHeadingLineTextEmpty: css`
      font-size: 12px;
      font-style: italic;
      opacity: 0.65;
      color: ${t(colors.gray[900], colors.gray[100])};
      line-height: 1.45;
    `,
    seoSerpIssueListItem: css`
      margin-top: 0.25rem;
    `,
    seoJsonLdBlockHeaderRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    `,
    serpPreviewLabelSub: css`
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 2px;
      color: ${t(colors.gray[700], colors.gray[300])};
    `,
    seoJsonLdBlockTypes: css`
      font-size: 11px;
      color: ${t(colors.gray[500], colors.gray[400])};
    `,
    seoJsonLdCopyButton: css`
      border: 1px solid ${t(colors.gray[300], colors.gray[700])};
      border-radius: 5px;
      padding: 3px 10px;
      background: transparent;
      cursor: pointer;
      font-size: 11px;
      color: ${t(colors.gray[600], colors.gray[400])};
      font-family: inherit;
    `,
    seoJsonLdPre: css`
      margin: 0;
      max-height: 260px;
      overflow: auto;
      padding: 10px;
      font-size: 11px;
      line-height: 1.5;
      border-radius: 6px;
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      background: ${t(colors.gray[50], '#0d1117')};
      color: ${t(colors.gray[800], colors.gray[300])};
      white-space: pre-wrap;
      word-break: break-word;
    `,
    seoIssueListTopSpaced: css`
      margin-top: 10px;
    `,
    seoJsonLdOkLine: css`
      margin-top: 8px;
      color: ${t(colors.green[700], '#16a34a')};
      font-size: 12px;
    `,
    seoJsonLdHealthCard: css`
      margin-bottom: 12px;
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      padding: 12px;
      background: ${t(colors.gray[50], colors.darkGray[900])};
    `,
    seoJsonLdHealthTitle: css`
      font-size: 12px;
      font-weight: 600;
      color: ${t(colors.gray[800], colors.gray[300])};
    `,
    seoJsonLdSupportedIntro: css`
      margin: 0 0 12px 0;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      background: ${t(colors.gray[50], colors.darkGray[900])};
    `,
    seoJsonLdSupportedIntroLabel: css`
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: ${t(colors.gray[600], colors.gray[400])};
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    `,
    seoJsonLdSupportedChips: css`
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    `,
    seoJsonLdSupportedChip: css`
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      font-family: ${fontFamily.mono};
      border: 1px solid ${t(colors.gray[200], colors.gray[700])};
      background: ${t(colors.white, colors.darkGray[800])};
      color: ${t(colors.gray[800], colors.gray[200])};
    `,
    seoJsonLdCardGrid: css`
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
    `,
    seoJsonLdEntityCard: css`
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      border-radius: 8px;
      padding: 8px 10px;
      background: ${t(colors.white, colors.darkGray[800])};
    `,
    seoJsonLdEntityCardHeader: css`
      font-size: 11px;
      font-weight: 700;
      color: ${t(colors.blue[700], colors.blue[400])};
      margin-bottom: 6px;
      font-family: ${fontFamily.mono};
    `,
    seoJsonLdEntityCardRows: css`
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
      line-height: 1.4;
    `,
    seoJsonLdEntityCardRow: css`
      display: flex;
      gap: 6px;
      align-items: baseline;
      min-width: 0;
    `,
    seoJsonLdEntityCardKey: css`
      flex-shrink: 0;
      color: ${t(colors.gray[500], colors.gray[500])};
      font-weight: 500;
    `,
    seoJsonLdEntityCardValue: css`
      color: ${t(colors.gray[900], colors.gray[100])};
      word-break: break-word;
      min-width: 0;
    `,
    seoJsonLdRawDetails: css`
      margin-top: 4px;
      border-radius: 6px;
      border: 1px solid ${t(colors.gray[200], colors.gray[800])};
      overflow: hidden;
    `,
    seoJsonLdRawSummary: css`
      cursor: pointer;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 500;
      color: ${t(colors.gray[600], colors.gray[400])};
      background: ${t(colors.gray[100], colors.darkGray[800])};
      list-style: none;
      user-select: none;
      &::-webkit-details-marker {
        display: none;
      }
    `,
    seoSocialAccentFacebook: css`
      border-color: #4267b2;
    `,
    seoSocialHeaderFacebook: css`
      color: #4267b2;
    `,
    seoSocialAccentTwitter: css`
      border-color: #1da1f2;
    `,
    seoSocialHeaderTwitter: css`
      color: #1da1f2;
    `,
    seoSocialAccentLinkedin: css`
      border-color: #0077b5;
    `,
    seoSocialHeaderLinkedin: css`
      color: #0077b5;
    `,
    seoSocialAccentDiscord: css`
      border-color: #5865f2;
    `,
    seoSocialHeaderDiscord: css`
      color: #5865f2;
    `,
    seoSocialAccentSlack: css`
      border-color: #4a154b;
    `,
    seoSocialHeaderSlack: css`
      color: #4a154b;
    `,
    seoSocialAccentMastodon: css`
      border-color: #6364ff;
    `,
    seoSocialHeaderMastodon: css`
      color: #6364ff;
    `,
    seoSocialAccentBluesky: css`
      border-color: #1185fe;
    `,
    seoSocialHeaderBluesky: css`
      color: #1185fe;
    `,
    seoPreviewImagePlaceholder: css`
      background: ${t(colors.gray[200], '#222')};
      color: ${t(colors.gray[500], '#888')};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      width: 100%;
    `,
  }
}

export function useSeoStyles() {
  const { theme } = useTheme()
  return createMemo(() => createSeoStyles(theme()))
}
