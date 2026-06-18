import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";

/**
 * SQL syntax highlighter — VS Code dark theme colors.
 * Keywords (blue), strings (orange), numbers (green), functions (yellow),
 * comments (green italic), operators (white).
 */
function highlightSQL(sql) {
  if (!sql) return "";

  const KEYWORDS = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
    "CROSS", "FULL", "ON", "GROUP", "ORDER", "BY", "HAVING", "LIMIT",
    "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "DISTINCT", "CASE",
    "WHEN", "THEN", "ELSE", "END", "INSERT", "UPDATE", "DELETE", "CREATE",
    "DROP", "ALTER", "TABLE", "INTO", "VALUES", "SET", "BETWEEN", "LIKE",
    "DESC", "ASC", "UNION", "ALL", "EXISTS", "WITH", "RECURSIVE", "OFFSET",
    "FETCH", "NEXT", "ROWS", "ONLY", "OVER", "PARTITION", "WINDOW",
    "TRUE", "FALSE", "IF", "THEN", "BEGIN", "COMMIT", "ROLLBACK",
  ];

  const FUNCTIONS = [
    "COUNT", "SUM", "AVG", "MAX", "MIN", "COALESCE", "NULLIF", "CAST",
    "CONVERT", "CONCAT", "LENGTH", "UPPER", "LOWER", "TRIM", "SUBSTRING",
    "REPLACE", "ROUND", "FLOOR", "CEIL", "ABS", "NOW", "DATE", "YEAR",
    "MONTH", "DAY", "EXTRACT", "TO_CHAR", "TO_DATE", "ROW_NUMBER",
    "RANK", "DENSE_RANK", "LAG", "LEAD", "FIRST_VALUE", "LAST_VALUE",
    "STRING_AGG", "ARRAY_AGG", "JSONB_BUILD_OBJECT",
  ];

  const C = {
    keyword:  "#569CD6", // blue
    function: "#DCDCAA", // yellow
    string:   "#CE9178", // orange
    number:   "#B5CEA8", // light green
    comment:  "#6A9955", // green
    operator: "#D4D4D4", // white
    default:  "#D4D4D4", // white
    alias:    "#9CDCFE", // light blue
  };

  return sql.split("\n").map((line) => {
    let result = "";
    let i = 0;

    while (i < line.length) {
      // Single-line comments --
      if (line[i] === "-" && line[i + 1] === "-") {
        result += `<span style="color:${C.comment};font-style:italic">${esc(line.slice(i))}</span>`;
        break;
      }

      // Strings 'text'
      if (line[i] === "'") {
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === "'" && line[j + 1] === "'") { j += 2; continue; }
          if (line[j] === "'") { j++; break; }
          j++;
        }
        result += `<span style="color:${C.string}">${esc(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      // Numbers
      if (/\d/.test(line[i]) && (i === 0 || /[\s(,=<>+\-*/]/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) j++;
        result += `<span style="color:${C.number}">${esc(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      // Words
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\w]/.test(line[j])) j++;
        const word = line.slice(i, j);
        const upper = word.toUpperCase();

        if (KEYWORDS.includes(upper)) {
          result += `<span style="color:${C.keyword};font-weight:600">${esc(word)}</span>`;
        } else if (FUNCTIONS.includes(upper)) {
          result += `<span style="color:${C.function}">${esc(word)}</span>`;
        } else {
          result += `<span style="color:${C.default}">${esc(word)}</span>`;
        }
        i = j;
        continue;
      }

      // Dot notation (table.column)
      if (line[i] === ".") {
        result += `<span style="color:#D4D4D4">.</span>`;
        i++;
        continue;
      }

      // Operators
      if ("=<>!+-*/%(),;".includes(line[i])) {
        result += `<span style="color:${C.operator}">${esc(line[i])}</span>`;
        i++;
        continue;
      }

      result += esc(line[i]);
      i++;
    }
    return result;
  }).join("\n");
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function SqlBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => highlightSQL(code), [code]);
  const lineCount = code ? code.split("\n").length : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#1e1e1e", border: "1px solid #333" }}
    >
      {/* Header — VS Code style */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: "#2d2d2d", borderBottom: "1px solid #404040" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace", marginLeft: 8 }}>
            query.sql
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition-all"
          style={{
            background: copied ? "rgba(40,200,64,0.15)" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: copied ? "#28c840" : "#888",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>

      {/* Code with line numbers */}
      <div className="flex overflow-auto" style={{ maxHeight: 400 }}>
        {/* Line numbers gutter */}
        <div
          className="flex-shrink-0 text-right select-none py-3 pr-3 pl-4"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.7,
            color: "#555",
            borderRight: "1px solid #333",
            background: "#1a1a1a",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Highlighted SQL */}
        <pre
          className="flex-1 py-3 px-4 m-0"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.7,
            overflow: "auto",
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}
