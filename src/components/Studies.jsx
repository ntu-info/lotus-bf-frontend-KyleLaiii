import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../api'
import './Studies.css'

export function Studies({ query }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('year')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 12 // Changed to 12 for better grid layout

  useEffect(() => { setPage(1) }, [query])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const url = `${API_BASE}/query/${encodeURIComponent(query)}/studies`
        const res = await fetch(url, { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch studies: ${e?.message || e}`)
        setRows([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query])

  const changeSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const A = a?.[sortKey]
      const B = b?.[sortKey]
      // Numeric comparison for year; string comparison for other fields
      if (sortKey === 'year') return (Number(A || 0) - Number(B || 0)) * dir
      return String(A || '').localeCompare(String(B || ''), 'en') * dir
    })
    return arr
  }, [rows, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className='flex flex-col rounded-2xl border'>
      <div className='flex items-center justify-between p-3'>
        <div className='card__title'>Studies</div>
        <button
          className='sort-button'
          onClick={() => changeSort('year')}
          title='Click to change sort order'
        >
          {sortDir === 'desc' ? '舊 → 新' : '新 → 舊'}
        </button>
      </div>


      {query && loading && (
        <div className='grid gap-3 p-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-10 animate-pulse rounded-lg bg-gray-100' />
          ))}
        </div>
      )}

      {query && err && (
        <div className='mx-3 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
          {err}
        </div>
      )}

      {query && !loading && !err && (
        <div className='studies-content'>
          <div className='studies-results'>
            <div className='studies-grid'>
              {pageRows.length === 0 ? (
                <div className='no-results'>No studies found</div>
              ) : (
                pageRows.map((study, i) => (
                  <div key={i} className='study-card'>
                    <h4 className='study-title'>{study.title || 'Untitled Study'}</h4>
                    <p className='study-authors'>{study.authors || 'Unknown Authors'}</p>
                    <div className='study-meta'>
                      <span className='journal'>{study.journal || 'No Journal'}</span>
                      <span className='meta-separator'>|</span>
                      <span className='year'>{study.year || 'No Year'}</span>
                      {study.study_id && (
                        <>
                          <span className='meta-separator'>|</span>
                          <a
                            className='pubmed-link'
                            href={`https://pubmed.ncbi.nlm.nih.gov/${study.study_id}/`}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            PubMed
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 左下角：總筆數 & 目前頁 */}
          <div className="pagination-info-inline">
            Total <b>{sorted.length}</b> records, page <b>{page}</b>/<b>{totalPages}</b>
          </div>

          {/* 右下角：四顆分頁按鈕 */}
          <div className="pagination-inline">
            <button disabled={page <= 1} onClick={() => setPage(1)} className='page-button'>⏮</button>
            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className='page-button'>Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className='page-button'>Next</button>
            <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className='page-button'>⏭</button>
          </div>
        </div>
      )}

    </div>
  )
}

