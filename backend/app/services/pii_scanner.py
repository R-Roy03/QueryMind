"""
PII Scanner — Detects personally identifiable information in database columns.
Uses regex patterns + column name heuristics + LLM governance advice.
"""
import re
import logging
from app.services.query_executor import query_executor
from app.llm.mistral_client import llm

logger = logging.getLogger(__name__)

PII_PATTERNS = {
    "email": {
        "pattern": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        "severity": "high",
        "mask": lambda v: v[:2] + "***@" + v.split("@")[-1] if "@" in str(v) else "***"
    },
    "indian_phone": {
        "pattern": r'(\+91[\-\s]?|0)?[6-9]\d{9}',
        "severity": "high",
        "mask": lambda v: str(v)[:3] + "****" + str(v)[-3:]
    },
    "aadhaar": {
        "pattern": r'\d{4}[\s\-]?\d{4}[\s\-]?\d{4}',
        "severity": "critical",
        "mask": lambda v: "XXXX-XXXX-" + str(v)[-4:]
    },
    "pan": {
        "pattern": r'[A-Z]{5}[0-9]{4}[A-Z]{1}',
        "severity": "high",
        "mask": lambda v: str(v)[:2] + "XXXXXXX"
    },
    "credit_card": {
        "pattern": r'\b(?:\d{4}[\s\-]?){3}\d{4}\b',
        "severity": "critical",
        "mask": lambda v: "**** **** **** " + str(v).replace(" ", "").replace("-", "")[-4:]
    },
    "ip_address": {
        "pattern": r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
        "severity": "medium",
        "mask": lambda v: ".".join(str(v).split(".")[:2]) + ".X.X"
    },
}

PII_COLUMN_HINTS = {
    "critical": ["aadhaar", "aadhar", "ssn", "passport", "credit_card", "card_number"],
    "high": ["email", "phone", "mobile", "contact", "pan_number", "dob", "date_of_birth"],
    "medium": ["name", "address", "city", "pincode", "ip", "location", "gender"],
}

SEVERITY_ORDER = ["medium", "high", "critical"]


def scan_column_for_pii(table_name: str, column_name: str) -> dict:
    """Scan a single column for PII using patterns + name heuristics."""
    try:
        result = query_executor.run(
            f"SELECT CAST({column_name} AS TEXT) FROM {table_name} "
            f"WHERE {column_name} IS NOT NULL LIMIT 100"
        )
        samples = [str(r[0]) for r in result['rows']]
    except Exception as e:
        return {"error": str(e), "column": column_name}

    detected_pii = []

    for pii_type, config in PII_PATTERNS.items():
        matches = [s for s in samples if re.search(config["pattern"], s)]
        if matches:
            confidence = round((len(matches) / len(samples)) * 100) if samples else 0
            if confidence >= 20:
                detected_pii.append({
                    "type": pii_type,
                    "severity": config["severity"],
                    "confidence": confidence,
                    "sample_count": len(matches),
                    "masked_example": config["mask"](matches[0]) if matches else None
                })

    col_lower = column_name.lower()
    for severity, hints in PII_COLUMN_HINTS.items():
        if any(hint in col_lower for hint in hints):
            if not any(p["type"] in col_lower for p in detected_pii):
                detected_pii.append({
                    "type": "name_heuristic",
                    "severity": severity,
                    "confidence": 70,
                    "note": f"Column name '{column_name}' suggests PII data"
                })
            break

    risk_level = "none"
    if detected_pii:
        risk_level = max(
            [p["severity"] for p in detected_pii],
            key=lambda x: SEVERITY_ORDER.index(x) if x in SEVERITY_ORDER else 0
        )

    return {
        "table": table_name,
        "column": column_name,
        "samples_checked": len(samples),
        "pii_detected": len(detected_pii) > 0,
        "findings": detected_pii,
        "risk_level": risk_level,
        "recommendation": _get_recommendation(detected_pii)
    }


def scan_full_schema_for_pii() -> dict:
    """Scan all tables and columns for PII."""
    from app.services.schema_extractor import schema_extractor
    schema = schema_extractor.get_schema()

    table_results = []
    total_pii_columns = 0

    for table in schema['tables']:
        col_results = []
        for col in table['columns']:
            result = scan_column_for_pii(table['name'], col['name'])
            col_results.append(result)
            if result.get('pii_detected'):
                total_pii_columns += 1

        table_results.append({
            "table": table['name'],
            "columns_scanned": len(table['columns']),
            "pii_columns": sum(1 for c in col_results if c.get('pii_detected')),
            "critical_columns": [c['column'] for c in col_results if c.get('risk_level') == 'critical'],
            "columns": col_results
        })

    pii_summary = [
        f"Table '{t['table']}': {t['pii_columns']} PII columns"
        for t in table_results if t['pii_columns'] > 0
    ]

    governance_advice = []
    if pii_summary:
        prompt = f"""You are a Data Governance expert. These PII findings were found in a database:
{chr(10).join(pii_summary)}

Write 3 specific, actionable governance recommendations for DPDP Act and GDPR compliance.
Be concise. Each recommendation max 2 sentences.
Return as JSON array: [{{"recommendation": "...", "priority": "immediate|short-term|long-term"}}]"""
        try:
            governance_advice = llm.chat_json(prompt)
            if isinstance(governance_advice, dict):
                governance_advice = governance_advice.get("recommendations", [])
        except Exception:
            governance_advice = []

    return {
        "total_tables": len(table_results),
        "total_pii_columns": total_pii_columns,
        "compliance_risk": "HIGH" if total_pii_columns > 3 else "MEDIUM" if total_pii_columns > 0 else "LOW",
        "tables": table_results,
        "governance_recommendations": governance_advice
    }


def _get_recommendation(findings: list) -> str:
    if not findings:
        return "No PII detected. Safe to use."
    severities = [f["severity"] for f in findings]
    if "critical" in severities:
        return "URGENT: Encrypt at rest + mask before any sharing. Restrict access."
    elif "high" in severities:
        return "Mask before sharing externally. Apply column-level security."
    return "Monitor access. Consider pseudonymization."
