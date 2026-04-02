import {
  addDays,
  formatCurrency,
  getPeriodKey,
  parsePeriodStart,
  toDate,
  toISODate,
} from "./forecastUtils";

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getSignedAmount(transaction) {
  const numericValue = Number(transaction?.cost ?? transaction?.amount ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getMonthEnd(date) {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(0, 0, 0, 0);
  return monthEnd;
}

function buildHistoricalTotals(transactions, periodKey, actionDate) {
  const totalsByDay = new Map();

  (transactions || [])
    .map((transaction) => ({
      amount: getSignedAmount(transaction),
      date: toDate(transaction?.date),
    }))
    .filter((transaction) => transaction.date && getPeriodKey(transaction.date) === periodKey && transaction.date <= actionDate)
    .sort((left, right) => left.date - right.date)
    .forEach((transaction) => {
      const isoDate = toISODate(transaction.date);
      totalsByDay.set(isoDate, roundCurrency((totalsByDay.get(isoDate) || 0) + transaction.amount));
    });

  return totalsByDay;
}

function calculateDomain(values, budgetLimit) {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (Number.isFinite(budgetLimit)) {
    numericValues.push(Number(budgetLimit));
  }

  const minValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : 100;
  const padding = Math.max(40, Math.round((maxValue - minValue) * 0.14));

  return [minValue - padding, maxValue + padding];
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0%";
  }

  return `${numericValue.toFixed(1)}%`;
}

function resolveStatus(projectedUsage, remainingBudget, monthlyImpact) {
  if (Number.isFinite(projectedUsage) && projectedUsage > 100) {
    return "negative";
  }

  if (Number.isFinite(remainingBudget) && remainingBudget < 0) {
    return "negative";
  }

  if (Number.isFinite(projectedUsage) && projectedUsage >= 85) {
    return "warning";
  }

  if (Number.isFinite(monthlyImpact) && monthlyImpact < 0) {
    return "positive";
  }

  return "positive";
}

function buildRecommendation({
  apiSimulation,
  monthlyImpact,
  averageDailySpend,
}) {
  if (!apiSimulation) {
    return {
      headline: "Preview is temporarily unavailable.",
      detail: "You can still continue, but the simulation service did not return enough data to score this decision.",
      status: "neutral",
    };
  }

  const projectedUsage = Number(apiSimulation.projected_percentage_used);
  const remainingBudget = Number(apiSimulation.remaining_budget_after_purchase);
  const riskLevel = String(apiSimulation.risk_level || "").toLowerCase();
  const normalizedAverageSpend = Math.max(0, Number(averageDailySpend) || 0);
  const daysUntilExhaustion = remainingBudget > 0 && normalizedAverageSpend > 0
    ? Math.floor(remainingBudget / normalizedAverageSpend)
    : null;

  const status = resolveStatus(projectedUsage, remainingBudget, monthlyImpact);

  if (projectedUsage > 100 || remainingBudget < 0) {
    return {
      headline: `This decision pushes you ${formatPercentage(Math.max(0, projectedUsage - 100))} over budget.`,
      detail: `You would overshoot the current monthly budget by ${formatCurrency(Math.abs(remainingBudget), { precise: true })}. ${apiSimulation.recommendation || ""}`.trim(),
      status: "negative",
    };
  }

  if (daysUntilExhaustion !== null && daysUntilExhaustion <= 10) {
    return {
      headline: `At your current pace, you could run out of budget in about ${daysUntilExhaustion} days.`,
      detail: `This action leaves ${formatCurrency(remainingBudget, { precise: true })} for the rest of the period. ${apiSimulation.recommendation || ""}`.trim(),
      status: "warning",
    };
  }

  if (projectedUsage >= 85 || riskLevel === "risk" || riskLevel === "moderate") {
    return {
      headline: `This keeps you near ${formatPercentage(projectedUsage)} of your budget threshold.`,
      detail: `${formatCurrency(remainingBudget, { precise: true })} would remain after the action. ${apiSimulation.recommendation || ""}`.trim(),
      status: "warning",
    };
  }

  if (monthlyImpact < 0) {
    return {
      headline: "This improves your near-term cash position.",
      detail: `The decision creates ${formatCurrency(Math.abs(monthlyImpact), { precise: true })} of extra room in this period and keeps you within a safe range.`,
      status: "positive",
    };
  }

  return {
    headline: "This is within your safe spending range.",
    detail: `${formatCurrency(remainingBudget, { precise: true })} should remain in the current budget after this action. ${apiSimulation.recommendation || ""}`.trim(),
    status,
  };
}

export function buildDecisionSimulationModel({
  transactions = [],
  pendingTransaction,
  apiSimulation,
}) {
  const actionDate = toDate(pendingTransaction?.date) || new Date();
  const periodKey = getPeriodKey(actionDate);
  const periodStart = parsePeriodStart(periodKey) || new Date(actionDate.getFullYear(), actionDate.getMonth(), 1);
  const periodEnd = getMonthEnd(actionDate);
  const historicalTotals = buildHistoricalTotals(transactions, periodKey, actionDate);

  const fallbackCurrentSpent = Array.from(historicalTotals.values()).reduce((sum, value) => sum + value, 0);
  const currentSpent = Number.isFinite(Number(apiSimulation?.current_spent_this_period))
    ? Number(apiSimulation.current_spent_this_period)
    : fallbackCurrentSpent;
  const projectedSpent = Number.isFinite(Number(apiSimulation?.projected_spent_this_period))
    ? Number(apiSimulation.projected_spent_this_period)
    : currentSpent + Number(pendingTransaction?.cost || 0);
  const monthlyImpact = roundCurrency(projectedSpent - currentSpent);
  const observedDays = Math.max(1, actionDate.getDate());
  const averageDailySpend = roundCurrency(currentSpent / observedDays);
  const budgetLimit = Number.isFinite(Number(apiSimulation?.current_monthly_budget))
    ? Number(apiSimulation.current_monthly_budget)
    : null;

  const chartData = [];
  const values = [];
  let rollingActual = 0;
  let cursor = new Date(periodStart);

  while (cursor <= actionDate) {
    const isoDate = toISODate(cursor);
    rollingActual = roundCurrency(rollingActual + (historicalTotals.get(isoDate) || 0));

    chartData.push({
      baseline: rollingActual,
      decision: rollingActual,
      isoDate,
      isActionDate: isoDate === toISODate(actionDate),
    });
    values.push(rollingActual);
    cursor = addDays(cursor, 1);
  }

  let rollingBaseline = roundCurrency(currentSpent);
  let rollingDecision = roundCurrency(currentSpent + monthlyImpact);

  if (chartData.length > 0) {
    chartData[chartData.length - 1] = {
      ...chartData[chartData.length - 1],
      baseline: rollingBaseline,
      decision: rollingDecision,
      deltaFromBaseline: monthlyImpact,
      isActionDate: true,
    };
    values.push(rollingBaseline, rollingDecision);
  }

  cursor = addDays(actionDate, 1);

  while (cursor && cursor <= periodEnd) {
    rollingBaseline = roundCurrency(rollingBaseline + averageDailySpend);
    rollingDecision = roundCurrency(rollingDecision + averageDailySpend);
    const isoDate = toISODate(cursor);

    chartData.push({
      baseline: rollingBaseline,
      decision: rollingDecision,
      deltaFromBaseline: roundCurrency(rollingDecision - rollingBaseline),
      isoDate,
      isActionDate: false,
    });
    values.push(rollingBaseline, rollingDecision);
    cursor = addDays(cursor, 1);
  }

  const recommendation = buildRecommendation({
    apiSimulation,
    monthlyImpact,
    averageDailySpend,
  });

  return {
    actionDate: toISODate(actionDate),
    averageDailySpend,
    budgetLimit,
    chartData,
    chartDomain: calculateDomain(values, budgetLimit),
    chartKey: `${periodKey}-${toISODate(actionDate)}-${monthlyImpact}`,
    currentSpent: roundCurrency(currentSpent),
    monthlyImpact,
    projectedSpent: roundCurrency(projectedSpent),
    recommendation,
    remainingBudget: Number.isFinite(Number(apiSimulation?.remaining_budget_after_purchase))
      ? Number(apiSimulation.remaining_budget_after_purchase)
      : null,
    riskLevel: String(apiSimulation?.risk_level || "unknown"),
    scenarios: Array.isArray(apiSimulation?.scenarios) ? apiSimulation.scenarios : [],
    usageAfter: Number.isFinite(Number(apiSimulation?.projected_percentage_used))
      ? Number(apiSimulation.projected_percentage_used)
      : null,
    usageBefore: Number.isFinite(Number(apiSimulation?.current_percentage_used))
      ? Number(apiSimulation.current_percentage_used)
      : null,
  };
}
