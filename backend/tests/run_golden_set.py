"""
Golden-set runner for the NL-to-SQL pipeline.

Drives each question in golden_set.py through the SAME generation steps as
POST /query/ask (app/routers/query_router.py):

    schema + semantic context  ->  TEXT_TO_SQL_PROMPT  ->  llm.chat_json
      ->  validate_sql  ->  query_executor.run  ->  compare to expected

Then reports the pass rate and, for every failure, prints the generated SQL
beside the expected answer and how that expected value was derived.

Requires a live Mistral API key (loaded from .env via app.config.settings) and
a reachable database (TARGET_DB_URL). It makes real API calls.

Usage (PowerShell), pointed at the local production-dialect Postgres:
    $env:TARGET_DB_URL="postgresql://sdil:sdilpass@localhost:5432/enterprise_demo"
    python -m pytest tests/run_golden_set.py -s        # or:
    python tests/run_golden_set.py
"""
import sys, os, json, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.schema_extractor import schema_extractor
from app.services.semantic_builder import semantic_builder
from app.services.sql_validator import validate_sql
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm
from app.llm.prompts import TEXT_TO_SQL_PROMPT
from tests.golden_set import GOLDEN_SET


# ----------------------------------------------------------------------------
# Result extraction + comparison. Defined ONCE and applied uniformly — no
# per-question special-casing, so the pass/fail verdict can't be massaged.
# ----------------------------------------------------------------------------
def _num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None

def _is_number(x):
    return _num(x) is not None and not isinstance(x, bool)

def _label_column(columns, rows):
    """Index of the first column whose values are non-numeric text.
    Used to pull the label out of (label, count) or (label, revenue) rows."""
    ncols = len(columns)
    for ci in range(ncols):
        vals = [r[ci] for r in rows if r[ci] is not None]
        if vals and all(not _is_number(v) for v in vals):
            return ci
    return 0

def _numeric_column(columns, rows):
    for ci in range(len(columns)):
        vals = [r[ci] for r in rows if r[ci] is not None]
        if vals and all(_is_number(v) for v in vals):
            return ci
    return len(columns) - 1


def compare(kind, expected, columns, rows):
    """Return (passed: bool, actual_repr: str, reason: str)."""
    if not rows:
        return False, "<no rows>", "query returned no rows"

    if kind == "scalar_num":
        actual = rows[0][0]
        a = _num(actual)
        if a is None:
            return False, repr(actual), "result is not numeric"
        # Integer-valued expectations must match exactly; decimals within 0.02.
        if float(expected).is_integer():
            ok = round(a) == expected
        else:
            ok = abs(a - float(expected)) <= 0.02
        return ok, f"{a:.4g}", ("" if ok else f"expected {expected}, got {a}")

    if kind == "scalar_str":
        actual = rows[0][0]
        ok = str(actual).strip().lower() == str(expected).strip().lower()
        return ok, repr(actual), ("" if ok else f"expected {expected!r}, got {actual!r}")

    if kind == "ordered_labels":
        li = _label_column(columns, rows)
        actual = [r[li] for r in rows][:len(expected)]
        ok = [str(x) for x in actual] == [str(x) for x in expected]
        return ok, repr(actual), ("" if ok else f"expected {expected}, got {actual}")

    if kind == "status_dict":
        li = _label_column(columns, rows)
        vi = _numeric_column(columns, rows)
        actual = {str(r[li]): int(_num(r[vi])) for r in rows if r[li] is not None}
        ok = actual == {str(k): int(v) for k, v in expected.items()}
        diff = {k: (expected.get(k), actual.get(k)) for k in set(expected) | set(actual)
                if expected.get(k) != actual.get(k)}
        return ok, json.dumps(actual), ("" if ok else f"mismatches (expected,got): {diff}")

    return False, "?", f"unknown comparison kind {kind}"


def run(verbose=True):
    schema = schema_extractor.get_schema()
    schema_str = schema_extractor.to_prompt_string(schema)
    semantic = semantic_builder.build()               # 1 LLM call, then cached
    semantic_str = semantic_builder.to_prompt_string(semantic["data"])

    results = []
    for item in GOLDEN_SET:
        rec = {"id": item["id"], "question": item["question"],
               "expected": item["expected"], "expected_from": item["expected_from"],
               "cmp": item["cmp"], "sql": None, "confidence": None,
               "actual": None, "passed": False, "reason": ""}
        try:
            prompt = TEXT_TO_SQL_PROMPT.format(
                schema_str=schema_str, semantic_str=semantic_str,
                question=item["question"], max_rows=500)
            gen = llm.chat_json(prompt)
            rec["sql"] = gen.get("sql")
            rec["confidence"] = gen.get("confidence")

            v = validate_sql(rec["sql"])
            if not v["valid"]:
                rec["reason"] = f"blocked by sql_validator: {v['issues']}"
            else:
                exec_result = query_executor.run(rec["sql"])
                passed, actual_repr, reason = compare(
                    item["cmp"], item["expected"],
                    exec_result["columns"], exec_result["rows"])
                rec["passed"], rec["actual"], rec["reason"] = passed, actual_repr, reason
        except Exception as e:
            rec["reason"] = f"exception: {type(e).__name__}: {str(e)[:200]}"

        results.append(rec)
        if verbose:
            mark = "PASS" if rec["passed"] else "FAIL"
            print(f"[{mark}] {rec['id']}  {item['question']}")
            print(f"        expected={rec['expected']}  actual={rec['actual']}  conf={rec['confidence']}")
            if not rec["passed"]:
                print(f"        reason: {rec['reason']}")
        time.sleep(0.4)  # be gentle on the API

    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    print("\n" + "=" * 78)
    print(f"PASS RATE: {passed}/{total} = {round(100*passed/total,1)}%")
    print("=" * 78)

    failures = [r for r in results if not r["passed"]]
    if failures:
        print(f"\nFAILURES ({len(failures)}) — generated SQL vs expected:\n")
        for r in failures:
            print(f"--- {r['id']}: {r['question']}")
            print(f"    self-reported confidence: {r['confidence']}")
            print(f"    EXPECTED : {r['expected']}")
            print(f"    DERIVED  : {r['expected_from']}")
            print(f"    ACTUAL   : {r['actual']}")
            print(f"    REASON   : {r['reason']}")
            print(f"    GENERATED SQL:")
            for line in (r["sql"] or "<none>").splitlines():
                print(f"        {line}")
            print()

    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "golden_set_results.json")
    json.dump({"pass_rate": f"{passed}/{total}", "results": results},
              open(out, "w"), indent=2, default=str)
    print(f"Full results written to {out}")
    return results


def test_golden_set():
    """pytest entry point — runs the set and asserts it at least executes.
    The pass-rate itself is reported, not asserted (honest failures are kept)."""
    results = run(verbose=True)
    assert len(results) == len(GOLDEN_SET)


if __name__ == "__main__":
    run()
