'use client'

import { useState, useCallback } from 'react'
import { ScoredPost } from '@/lib/reddit'
import {
  Activity,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Zap,
} from 'lucide-react'

type Filter = 'all' | 'draft_response' | 'monitor' | 'skip'

const ACTION_COLORS: Record<string, string> = {
  draft_response: '#22c55e',
  monitor: '#eab308',
  skip: '#444444',
}

const ACTION_LABELS: Record<string, string> = {
  draft_response: 'HIGH INTENT',
  monitor: 'MONITOR',
  skip: 'LOW SIGNAL',
}

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 5) return '#eab308'
  return '#444444'
}

function timeAgo(utc: number): string {
  const diff = Math.floor(Date.now() / 1000 - utc)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function PostCard({ post }: { post: ScoredPost }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const getDraft = useCallback(async () => {
    if (draft) { setExpanded(e => !e); return }
    setLoading(true)
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      const data = await res.json()
      setDraft(data.reply)
      setExpanded(true)
    } finally {
      setLoading(false)
    }
  }, [draft, post])

  const copy = useCallback(() => {
    if (!draft) return
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [draft])

  const fillWidth = `${(post.intentScore / 10) * 100}%`

  return (
    <div
      className="fade-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        marginBottom: 12,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
        {/* Score */}
        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 48 }}>
          <div
            className="mono"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: scoreColor(post.intentScore),
              lineHeight: 1,
            }}
          >
            {post.intentScore}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>/ 10</div>
          <div className="score-bar" style={{ marginTop: 8 }}>
            <div
              className="score-fill"
              style={{ width: fillWidth, background: scoreColor(post.intentScore) }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span
              className="mono"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: ACTION_COLORS[post.recommendedAction],
                background: `${ACTION_COLORS[post.recommendedAction]}15`,
                padding: '2px 8px',
                borderRadius: 3,
                border: `1px solid ${ACTION_COLORS[post.recommendedAction]}30`,
                letterSpacing: '0.08em',
              }}
            >
              {ACTION_LABELS[post.recommendedAction]}
            </span>
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              r/{post.subreddit}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {timeAgo(post.created_utc)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              ↑{post.score} · {post.num_comments} comments
            </span>
          </div>

          <a
            href={`https://reddit.com${post.permalink}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'block',
              marginBottom: 6,
              lineHeight: 1.4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text)')}
          >
            {post.title}
            <ExternalLink size={12} style={{ marginLeft: 6, opacity: 0.4, display: 'inline' }} />
          </a>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {post.reason}
          </p>
        </div>
      </div>

      {/* Body preview */}
      {post.selftext && post.selftext.length > 10 && (
        <div
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {post.selftext.slice(0, 280)}{post.selftext.length > 280 ? '…' : ''}
        </div>
      )}

      {/* Actions */}
      {post.recommendedAction === 'draft_response' && (
        <div>
          <button
            onClick={getDraft}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--border2)',
              borderRadius: 6,
              padding: '7px 14px',
              color: 'var(--text)',
              fontSize: 13,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--sans)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--green)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--green)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
            }}
          >
            {loading ? (
              <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <MessageSquare size={13} />
            )}
            {loading ? 'Drafting…' : draft ? (expanded ? 'Hide draft' : 'Show draft') : 'Draft reply'}
            {draft && !loading && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
          </button>

          {expanded && draft && (
            <div
              className="fade-up"
              style={{
                marginTop: 10,
                background: 'var(--surface2)',
                border: '1px solid #22c55e30',
                borderRadius: 6,
                padding: '14px 16px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <span className="mono" style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.08em' }}>
                  DRAFTED REPLY
                </span>
                <button
                  onClick={copy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#22c55e' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'var(--sans)',
                    padding: '3px 8px',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {draft}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState<ScoredPost[]>([])
  const [loading, setLoading] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  const scan = useCallback(async () => {
    setLoading(true)
    setScanError(null)
    try {
      const res = await fetch('/api/scan')
      const data = await res.json()
      if (data.error) {
        setScanError(data.error)
        setScanned(true)
      } else {
        setPosts(data.posts ?? [])
        setScanned(true)
        setLastScan(new Date().toLocaleTimeString())
      }
    } catch (e) {
      setScanError(String(e))
      setScanned(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const filtered = filter === 'all' ? posts : posts.filter(p => p.recommendedAction === filter)

  const highIntent = posts.filter(p => p.recommendedAction === 'draft_response').length
  const monitor = posts.filter(p => p.recommendedAction === 'monitor').length

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${posts.length})` },
    { key: 'draft_response', label: `High Intent (${highIntent})` },
    { key: 'monitor', label: `Monitor (${monitor})` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          background: 'var(--bg)',
          zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: 'var(--accent)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={14} color="#fff" />
            </div>
            <div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                TYPEWISE RADAR
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 10 }}>
                community intent monitor
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {lastScan && (
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                last scan {lastScan}
              </span>
            )}
            {scanned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--green)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }}
                />
                <span className="mono" style={{ fontSize: 11, color: 'var(--green)' }}>LIVE</span>
              </div>
            )}
            <button
              onClick={scan}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: loading ? 'var(--surface)' : 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'var(--sans)',
                transition: 'background 0.15s',
              }}
            >
              {loading ? (
                <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={13} />
              )}
              {loading ? 'Scanning…' : scanned ? 'Re-scan' : 'Scan Reddit'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px' }}>
        {/* Hero / empty state */}
        {!scanned && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              borderRadius: 12,
              border: '1px dashed var(--border)',
              marginBottom: 32,
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 16 }}>
              SYSTEM READY
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 300,
                color: 'var(--text)',
                marginBottom: 12,
                fontFamily: 'var(--sans)',
                lineHeight: 1.3,
              }}
            >
              Find CS buyers before<br />
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>your competitors do</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
              Scans Reddit for posts from CS leaders evaluating AI support platforms.
              Scores intent, flags high-signal posts, drafts contextual replies.
            </p>
            <button
              onClick={scan}
              style={{
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 8,
                padding: '12px 28px',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Zap size={15} />
              Run first scan
            </button>
            <div
              style={{
                marginTop: 48,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                background: 'var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Subreddits monitored', value: '7' },
                { label: 'Intent signals scored by AI', value: '1–10' },
                { label: 'Reply drafts generated', value: 'auto' },
              ].map(item => (
                <div
                  key={item.label}
                  style={{ background: 'var(--surface)', padding: '20px 24px', textAlign: 'left' }}
                >
                  <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
              <RefreshCw size={18} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
              <span className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                scanning reddit + scoring intent…
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Pulling posts from r/CustomerSuccess, r/SaaS, r/customer_service + search results
            </p>
          </div>
        )}

        {/* Error state */}
        {scanned && !loading && scanError && (
          <div style={{
            background: '#1a0a0a',
            border: '1px solid #E53E3E40',
            borderRadius: 8,
            padding: '20px 24px',
            marginBottom: 24,
          }}>
            <div className="mono" style={{ fontSize: 11, color: '#E53E3E', marginBottom: 8, letterSpacing: '0.08em' }}>SCAN ERROR</div>
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{scanError}</p>
            <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Check that REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are set in Vercel environment variables.
            </p>
          </div>
        )}

        {/* Results */}
        {scanned && !loading && !scanError && (
          <>
            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {[
                { label: 'posts found', value: posts.length, color: 'var(--text)' },
                { label: 'high intent', value: highIntent, color: 'var(--green)' },
                { label: 'to monitor', value: monitor, color: 'var(--yellow)' },
                {
                  label: 'avg score',
                  value: posts.length
                    ? (posts.reduce((a, b) => a + b.intentScore, 0) / posts.length).toFixed(1)
                    : '—',
                  color: 'var(--blue)',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '16px 20px',
                  }}
                >
                  <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="mono"
                  style={{
                    background: filter === f.key ? 'var(--surface2)' : 'transparent',
                    border: `1px solid ${filter === f.key ? 'var(--border2)' : 'var(--border)'}`,
                    borderRadius: 6,
                    padding: '6px 14px',
                    color: filter === f.key ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Post list */}
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border)',
                  borderRadius: 8,
                }}
              >
                No posts in this category right now.
              </div>
            ) : (
              filtered.map((post, i) => (
                <div key={post.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <PostCard post={post} />
                </div>
              ))
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
