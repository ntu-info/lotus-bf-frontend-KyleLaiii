import { API_BASE } from '../api'
import { useEffect, useMemo, useState } from 'react'
import './Terms.css'  

export function Terms ({ onPickTerm }) {
  const [terms, setTerms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [displayCount, setDisplayCount] = useState(30) // 初始顯示30個

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    const load = async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await fetch(`${API_BASE}/terms`, { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!alive) return
        setTerms(Array.isArray(data?.terms) ? data.terms : [])
      } catch (e) {
        if (!alive) return
        setErr(`Failed to fetch terms: ${e?.message || e}`)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false; ac.abort() }
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return terms
    return terms.filter(t => t.toLowerCase().includes(s))
  }, [terms, search])

  return (
    <div className='terms'>
      <div className='terms__controls'>
        <div className='search-box'>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='搜尋 Neurosynth 術語…'
            className='search-input'
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className='clear-button'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className='terms__skeleton'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='skeleton-item animate-pulse' />
          ))}
        </div>
      )}

      {err && (
        <div className='error-message'>
          {err}
        </div>
      )}

      {!loading && !err && (
        <div 
          className='terms-container'
          onScroll={(e) => {
            const element = e.target;
            if (element.scrollHeight - element.scrollTop <= element.clientHeight * 1.2) {
              setDisplayCount(prev => Math.min(prev + 30, filtered.length));
            }
          }}
        >
          {filtered.length === 0 ? (
            <div className='no-results'>No terms found</div>
          ) : (
            <>
              <div className='terms-cloud'>
                <div className='terms-grid'>
                  {filtered.slice(0, displayCount).map((t, idx) => (
                    <button
                      key={`${t}-${idx}`}
                      className='term-chip'
                      onClick={() => onPickTerm?.(t)}
                      title={t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {displayCount < filtered.length && (
                <div className='load-more-indicator'>
                  滾動以載入更多...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

