function toFiniteNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function mapIntelligenceHistoryRecord(record, index = 0) {
  if (record?.projected_impact) {
    const balanceChange = toFiniteNumber(record.projected_impact.balance_change, 0);

    return {
      id: record.id || `pred-${index}`,
      name: record.projected_impact.category_effect || record.recommendation || "Intelligence analysis",
      amount: -balanceChange,
      confidence: toFiniteNumber(record.confidence, 0),
      explanation: record.explanation || "",
      recommendation: record.recommendation || "",
      riskScore: toFiniteNumber(record.risk_score, 0),
    };
  }

  const legacyAmount = toFiniteNumber(record?.predicted_spending, 0);

  return {
    id: record?.id || `pred-${index}`,
    name: record?.target_data || "Predicted Transaction",
    amount: legacyAmount,
    confidence: toFiniteNumber(record?.confidence_level, 0),
    explanation: "",
    recommendation: "",
    riskScore: 0,
  };
}

export function mapIntelligenceHistoryRecords(records = []) {
  return (records || []).map((record, index) => mapIntelligenceHistoryRecord(record, index));
}
