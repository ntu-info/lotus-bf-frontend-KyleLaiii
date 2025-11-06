export function QueryBuilder({ query, setQuery }) {
  const append = (token) => setQuery((q) => (q ? `${q} ${token}` : token));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setQuery(e.currentTarget.value);
    }
  };

  return (
    <div className="flex flex-col gap-3 qb rounded-2xl border p-3">
      {/* Header */}
      <div className="flex items-center">
        <div className="card__title">Query Builder</div>
      </div>

      {/* Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Create a query here, e.g.: [-22,-4,18] NOT emotion"
        className="qb__input w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
       style={{ width: "100%" }}/>

      {/* Tip (English) */}
      {/*<div className="text-xs text-gray-600">
        Tip: You can mix MNI locations in the query string, such as "[-22,-4,-18] NOT emotion" (without the quotes).
      </div>*/}

      {/* The "Current Query" row was removed per requirement #3. */}
      {/* Operators + Reset */}
        <div className="qb-toolbar">
          {['AND','OR','NOT','(',')'].map(tok => (
            <button
              key={tok}
              onClick={() => append(tok)}
              className="btn"
              type="button"
            >
              {tok}
            </button>
          ))}
          <button onClick={() => setQuery('')} className="btn" type="button">Reset</button>
        </div>
    </div>
  );
}
