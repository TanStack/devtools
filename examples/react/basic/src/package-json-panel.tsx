import { devtoolsEventClient } from '@tanstack/devtools-vite/client'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

export const PackageJsonPanel = () => {
  const [packageJson, setPackageJson] = useState<any>(null)
  const [outdatedDeps, setOutdatedDeps] = useState<
    Record<
      string,
      {
        current: string
        wanted: string
        latest: string
        type?: 'dependencies' | 'devDependencies'
      }
    >
  >({})

  useEffect(() => {
    devtoolsEventClient.emit('mounted', undefined as any)
    const off = devtoolsEventClient.on('ready', (event) => {
      setPackageJson(event.payload.packageJson)
      setOutdatedDeps(event.payload.outdatedDeps || {})
    })
    return () => {
      off?.()
    }
  }, [])

  const hasOutdated = Object.keys(outdatedDeps || {}).length > 0

  // Helpers
  const stripRange = (v?: string) => (v ?? '').replace(/^[~^><=v\s]*/, '')
  const parseSemver = (v?: string) => {
    const s = stripRange(v)
    const m = s.match(/^(\d+)\.(\d+)\.(\d+)/)
    if (!m) return null
    return { major: +m[1], minor: +m[2], patch: +m[3] }
  }
  const diffType = (
    current?: string,
    latest?: string,
  ): 'major' | 'minor' | 'patch' | null => {
    const c = parseSemver(current)
    const l = parseSemver(latest)
    if (!c || !l) return null
    if (l.major > c.major) return 'major'
    if (l.major === c.major && l.minor > c.minor) return 'minor'
    if (l.major === c.major && l.minor === c.minor && l.patch > c.patch)
      return 'patch'
    return null
  }
  const diffColor: Record<'major' | 'minor' | 'patch', string> = {
    major: '#ef4444',
    minor: '#f59e0b',
    patch: '#10b981',
  }

  const containerStyle: CSSProperties = { padding: 10 }
  const metaStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: 6,
    marginBottom: 8,
  }
  const sectionStyle: CSSProperties = {
    margin: '8px 0',
    padding: '8px',
    border: '1px solid #444',
    borderRadius: 6,
  }
  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  }
  const thtd: CSSProperties = {
    borderBottom: '1px solid #333',
    padding: '4px 6px',
    textAlign: 'left',
  }
  const badge = (text: string, color: string) => (
    <span
      style={{
        background: color,
        color: '#fff',
        borderRadius: 4,
        padding: '1px 4px',
        fontSize: 11,
      }}
    >
      {text}
    </span>
  )
  const btn = (
    label: string,
    onClick: () => void,
    variant: 'primary' | 'ghost' = 'primary',
  ) => (
    <button
      onClick={onClick}
      style={{
        padding: '2px 6px',
        borderRadius: 5,
        border:
          variant === 'primary' ? '1px solid #6d28d9' : '1px solid transparent',
        cursor: 'pointer',
        background: variant === 'primary' ? '#7c3aed' : 'transparent',
        color: variant === 'primary' ? '#fff' : '#7c3aed',
        fontSize: 12,
      }}
    >
      {label}
    </button>
  )

  const VersionCell = ({
    dep,
    specified,
  }: {
    dep: string
    specified: string
  }) => {
    const info = outdatedDeps[dep]
    const current = info?.current ?? specified
    const latest = info?.latest
    const dt = info ? diffType(current, latest) : null
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{current}</span>
        {dt && latest ? (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span style={{ opacity: 0.6 }}>→</span>
            {badge(`latest ${latest}`, diffColor[dt])}
          </span>
        ) : null}
      </div>
    )
  }

  const UpgradeRowActions = ({ name }: { name: string }) => {
    const info = outdatedDeps[name]
    if (!info) return null
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        {btn('Wanted', () =>
          (devtoolsEventClient as any).emit('upgrade-dependency', {
            name,
            target: info.wanted,
          } as any),
        )}
        {btn(
          'Latest',
          () =>
            (devtoolsEventClient as any).emit('upgrade-dependency', {
              name,
              target: info.latest,
            } as any),
          'ghost',
        )}
      </div>
    )
  }

  const makeLists = (names?: string[]) => {
    const entries = Object.entries(outdatedDeps).filter(
      ([n]) => !names || names.includes(n),
    )
    const wantedList = entries.map(([name, info]) => ({
      name,
      target: info.wanted,
    }))
    const latestList = entries.map(([name, info]) => ({
      name,
      target: info.latest,
    }))
    return { wantedList, latestList }
  }

  const BulkActions = ({ names }: { names?: string[] }) => {
    const { wantedList, latestList } = makeLists(names)
    if (wantedList.length === 0 && latestList.length === 0) return null
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {btn('All → wanted', () =>
          (devtoolsEventClient as any).emit('upgrade-dependencies-bulk', {
            list: wantedList,
          } as any),
        )}
        {btn(
          'All → latest',
          () =>
            (devtoolsEventClient as any).emit('upgrade-dependencies-bulk', {
              list: latestList,
            } as any),
          'ghost',
        )}
      </div>
    )
  }

  const renderDeps = (title: string, deps?: Record<string, string>) => {
    const names = Object.keys(deps || {})
    const someOutdatedInSection = names.some((n) => !!outdatedDeps[n])
    return (
      <div style={sectionStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
          {someOutdatedInSection ? <BulkActions names={names} /> : null}
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thtd}>Package</th>
              <th style={thtd}>Version</th>
              <th style={thtd}>Status</th>
              <th style={thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(deps || {}).map(([dep, version]) => {
              const info = outdatedDeps[dep]
              const isOutdated = !!info && info.current !== info.latest
              return (
                <tr key={dep}>
                  <td style={thtd}>{dep}</td>
                  <td style={thtd}>
                    <VersionCell dep={dep} specified={version as string} />
                  </td>
                  <td style={thtd}>
                    {isOutdated
                      ? badge('Outdated', '#e11d48')
                      : badge('OK', '#10b981')}
                  </td>
                  <td style={thtd}>
                    {isOutdated ? <UpgradeRowActions name={dep} /> : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Package.json</h2>
      {packageJson ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={sectionStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 14 }}>
              Package info
            </h3>
            <div style={metaStyle}>
              <div>
                <strong>Name</strong>
              </div>
              <div>{packageJson.name}</div>
              <div>
                <strong>Version</strong>
              </div>
              <div>v{packageJson.version}</div>
              <div>
                <strong>Description</strong>
              </div>
              <div>{packageJson.description}</div>
              <div>
                <strong>Author</strong>
              </div>
              <div>{packageJson.author}</div>
              <div>
                <strong>License</strong>
              </div>
              <div>{packageJson.license}</div>
              <div>
                <strong>Repository</strong>
              </div>
              <div>{packageJson.repository?.url || packageJson.repository}</div>
            </div>
          </div>
          {renderDeps('Dependencies', packageJson.dependencies)}
          {renderDeps('Dev Dependencies', packageJson.devDependencies)}
          <div style={sectionStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 14 }}>
              Outdated (All)
            </h3>
            {hasOutdated ? (
              <BulkActions />
            ) : (
              <p style={{ margin: 0 }}>All dependencies are up to date.</p>
            )}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0 }}>No package.json data available</p>
      )}
    </div>
  )
}
