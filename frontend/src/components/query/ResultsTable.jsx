export default function ResultsTable({ columns, rows, rowCount }) {
  if (!columns || !rows) return null;
  return (
    <div
      className="rounded-lg overflow-auto max-h-[450px]"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr
            className="sticky top-0 z-[1]"
            style={{ background: "var(--bg-card)", borderBottom: "2px solid var(--border-default)" }}
          >
            {columns.map((col, j) => (
              <th
                key={j}
                className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                style={{ color: "var(--text-muted)" }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="transition-colors duration-100 cursor-default"
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: i % 2 === 0 ? "transparent" : "var(--bg-surface)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "var(--bg-surface)"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-6 py-3 text-sm font-mono whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {cell === null
                    ? <span className="italic" style={{ color: "var(--text-faint)" }}>null</span>
                    : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rowCount > 0 && (
        <div
          className="px-5 py-2.5 text-xs text-right"
          style={{ background: "var(--bg-surface)", color: "var(--text-muted)", borderTop: "1px solid var(--border-default)" }}
        >
          Showing {rows.length} of {rowCount} rows
        </div>
      )}
    </div>
  );
}
