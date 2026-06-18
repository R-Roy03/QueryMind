import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Python syntax highlighter — VS Code dark theme colors.
 * Handles keywords, strings, comments, decorators, numbers, functions, builtins.
 */
function highlightPython(code) {
  if (!code) return "";

  const KEYWORDS = [
    "import", "from", "as", "def", "class", "return", "if", "elif", "else",
    "for", "while", "in", "not", "and", "or", "is", "with", "try", "except",
    "finally", "raise", "pass", "break", "continue", "yield", "lambda",
    "True", "False", "None", "async", "await", "global", "nonlocal", "del",
    "assert",
  ];

  const BUILTINS = [
    "print", "len", "range", "str", "int", "float", "list", "dict", "set",
    "tuple", "type", "isinstance", "hasattr", "getattr", "setattr", "super",
    "property", "staticmethod", "classmethod", "enumerate", "zip", "map",
    "filter", "sorted", "reversed", "any", "all", "min", "max", "sum", "abs",
    "round", "open", "format",
  ];

  // Colors — VS Code dark+ theme
  const C = {
    keyword:   "#C586C0",   // purple-pink
    string:    "#CE9178",   // orange
    comment:   "#6A9955",   // green
    number:    "#B5CEA8",   // light green
    decorator: "#DCDCAA",   // yellow
    func:      "#DCDCAA",   // yellow
    builtin:   "#4EC9B0",   // teal
    param:     "#9CDCFE",   // light blue
    operator:  "#D4D4D4",   // white
    default:   "#D4D4D4",   // white
  };

  // Process line by line
  return code.split("\n").map((line) => {
    let result = "";
    let i = 0;

    while (i < line.length) {
      // Comments
      if (line[i] === "#") {
        result += `<span style="color:${C.comment};font-style:italic">${escHtml(line.slice(i))}</span>`;
        break;
      }

      // Decorator
      if (line[i] === "@" && (i === 0 || /\s/.test(line[i-1]))) {
        let j = i + 1;
        while (j < line.length && /[\w.]/.test(line[j])) j++;
        result += `<span style="color:${C.decorator}">${escHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      // Strings (triple or single/double quotes)
      if ((line[i] === '"' || line[i] === "'") || (line.slice(i, i+3) === '"""' || line.slice(i, i+3) === "'''")) {
        const triple = line.slice(i, i+3) === '"""' || line.slice(i, i+3) === "'''";
        const delim = triple ? line.slice(i, i+3) : line[i];
        let j = i + delim.length;
        while (j < line.length) {
          if (line[j] === "\\" && j + 1 < line.length) { j += 2; continue; }
          if (triple ? line.slice(j, j+3) === delim : line[j] === delim) { j += delim.length; break; }
          j++;
        }
        result += `<span style="color:${C.string}">${escHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      // f-strings prefix
      if ((line[i] === "f" || line[i] === "F") && (line[i+1] === '"' || line[i+1] === "'")) {
        result += `<span style="color:${C.string}">${escHtml(line[i])}</span>`;
        i++;
        continue;
      }

      // Numbers
      if (/\d/.test(line[i]) && (i === 0 || /[\s(=,[\-+*/<>:]/.test(line[i-1]))) {
        let j = i;
        while (j < line.length && /[\d._xXoObBeE]/.test(line[j])) j++;
        result += `<span style="color:${C.number}">${escHtml(line.slice(i, j))}</span>`;
        i = j;
        continue;
      }

      // Words (identifiers, keywords)
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\w]/.test(line[j])) j++;
        const word = line.slice(i, j);

        if (KEYWORDS.includes(word)) {
          result += `<span style="color:${C.keyword};font-weight:600">${escHtml(word)}</span>`;
        } else if (BUILTINS.includes(word)) {
          result += `<span style="color:${C.builtin}">${escHtml(word)}</span>`;
        } else if (j < line.length && line[j] === "(") {
          // Function call
          result += `<span style="color:${C.func}">${escHtml(word)}</span>`;
        } else if (word === "self") {
          result += `<span style="color:${C.param}">${escHtml(word)}</span>`;
        } else {
          result += `<span style="color:${C.default}">${escHtml(word)}</span>`;
        }
        i = j;
        continue;
      }

      // Operators
      if ("=<>!+-*/%&|^~".includes(line[i])) {
        result += `<span style="color:${C.operator}">${escHtml(line[i])}</span>`;
        i++;
        continue;
      }

      // Everything else
      result += escHtml(line[i]);
      i++;
    }

    return result;
  }).join("\n");
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function GeneratedCode({ code }) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => highlightPython(code), [code]);

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
      {/* Header bar — VS Code style */}
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
            airflow_dag.py
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
      <div className="flex overflow-auto" style={{ maxHeight: 320 }}>
        {/* Line numbers */}
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

        {/* Highlighted code */}
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
