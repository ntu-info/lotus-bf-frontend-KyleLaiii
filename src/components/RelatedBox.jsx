import { useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../api'

/** 從 query 抓第一個「詞」：忽略 AND/OR/NOT ( ) 與座標/符號 */
function pickFirstTermFromQuery(q = '') {
  // ... (這個函式不需要變動)
  if (!q) return ''
  const tokens = q.split(/\s+/)
  const stop = new Set(['AND', 'OR', 'NOT', '(', ')'])
  for (const raw of tokens) {
    const t = raw.trim()
    if (!t || stop.has(t)) continue
    if (/^\[?-?\d+,\s*-?\d+,\s*-?\d+\]?$/.test(t)) continue
    return t
  }
  return ''
}

export default function RelatedBox({ lastPickedTerm, query }) {
  const anchor = lastPickedTerm || pickFirstTermFromQuery(query)
  
  // 1. 將 state 從單一 item 改為 items 陣列
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // 2. 新增 state 來控制顯示的數量，預設為 10
  const [count, setCount] = useState(6)

  useEffect(() => {
    if (!anchor) { 
      setItems([]) //  anchor 為空時清空陣列
      return 
    }
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true); setErr('')
      try {
        const url = `${API_BASE}/terms/${encodeURIComponent(anchor)}`
        const res = await fetch(url, { signal: ac.signal })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        
        // 3. 儲存完整的 related 陣列，而不是只存第一筆
        const relatedTerms = Array.isArray(data?.related) ? data.related : []
        setItems(relatedTerms)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch related for "${anchor}": ${e?.message || e}`)
        setItems([]) // 發生錯誤時也清空陣列
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [anchor])

  // 4. 使用 useMemo 來計算要顯示的項目，只取前 count 筆
  const displayedItems = useMemo(() => {
    return items.slice(0, Math.max(0, count))
  }, [items, count])

  return (
    <div className="related-card">
      {/* 5. 建立一個 header 容器來放標題和數量輸入框 */}
      <div className="related-header">
        <div className="card__title">Related</div>
        {anchor && !loading && items.length > 0 && (
          <label className="related-count-label">
            Show:
            <input
              type="number"
              className="related-count-input"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              min="1"
              step="1"
              title="Number of related terms to show"
            />
          </label>
        )}
      </div>

      {!anchor && <div className="related-empty">請先輸入或點選一個 term</div>}
      {anchor && loading && <div className="related-empty">Loading…</div>}
      {anchor && err && <div className="related-error">{err}</div>}
      
      {/* 6. 修改 render 邏輯 */}
      {anchor && !loading && !err && displayedItems.length > 0 && (
        // 7. 建立一個 flex-wrap 容器
        <div className="related-pills-container">
          {/* 8. map 顯示所有 displayedItems */}
          {displayedItems.map((item) => (
            <button 
              className="related-pill" 
              type="button" 
              key={item.term} 
              title={item.term}
            >
              <div className="related-term">{item.term}</div>
              <div className="related-sub">
                co_count: <b>{item.co_count}</b> | jaccard: <b>{item.jaccard.toFixed(3)}</b>
              </div>
            </button>
          ))}
        </div>
      )}
      {anchor && !loading && !err && items.length === 0 && (
        <div className="related-empty">No related term</div>
      )}
    </div>
  )
}