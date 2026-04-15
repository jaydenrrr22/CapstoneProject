import {
  addDays,
  getPeriodKey,
  parsePeriodStart,
  toDate,
  toISODate,
} from "./forecastUtils";
import {
  getBudgetPressureAmount as getBudgetPressureValue,
  isBudgetExcludedCategory,
} from "./finance";

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getBudgetPressureAmount(transaction) {
  return getBudgetPressureValue(
    transaction?.cost ?? transaction?.amount ?? 0,
    transaction?.category
  );
}

function getMonthEnd(date) {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(0, 0, 0, 0);
  return monthEnd;
}

function buildHistoricalTotals(transactions, periodKey, actionDate, amountResolver) {
  const totalsByDay = new Map();

  (transactions || [])
    .map((transaction) => ({
      amount: amountResolver(transaction),
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

function toFiniteNumber(value, fallback = null) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function resolveRecommendationStatus({
  decisionDelta,
  projectedUsage,
  remainingBudget,
  riskLevel,
  riskScore,
}) {
  if (decisionDelta < 0) {
    return "positive";
  }

  if (String(riskLevel || "").toLowerCase() === "risk") {
    return "negative";
  }

  if (remainingBudget !== null && remainingBudget < 0) {
    return "negative";
  }

  if (projectedUsage !== null && projectedUsage >= 100) {
    return "negative";
  }

  if (String(riskLevel || "").toLowerCase() === "moderate" || (riskScore !== null && riskScore >= 0.45)) {
    return "warning";
  }

  return "positive";
}

function normalizeScenarios(currentValue, scenarios = []) {
  return scenarios.map((scenario) => {
    const projectedSpentThisPeriod = toFiniteNumber(scenario?.projected_spent_this_period, currentValue);
    const projectedPercentageUsed = toFiniteNumber(scenario?.projected_percentage_used);
    const remainingBudgetAfterPurchase = toFiniteNumber(scenario?.remaining_budget_after_purchase);
    const balanceChange = toFiniteNumber(scenario?.balance_change, null);
    const impactFromCurrent = roundCurrency(projectedSpentThisPeriod - currentValue);

    return {
      balanceChange: balanceChange ?? roundCurrency(-impactFromCurrent),
      display_value: projectedSpentThisPeriod,
      impactFromCurrent,
      projected_spent_this_period: projectedSpentThisPeriod,
      projected_percentage_used: projectedPercentageUsed,
      remaining_budget_after_purchase: remainingBudgetAfterPurchase,
      risk_level: String(scenario?.risk_level || "Unknown"),
      scenario_type: scenario?.scenario_type || "Scenario",
    };
  });
}

export function buildDecisionSimulationModel({
  transactions = [],
  pendingTransaction,
  apiSimulation,
}) {
  const actionDate = toDate(pendingTransaction?.date) || new Date();
  const pendingCost = Math.abs(Number(pendingTransaction?.cost || 0));
  const pendingCategory = pendingTransaction?.category;
  const isDeposit = String(pendingCategory || "").trim().toLowerCase().startsWith("income");
  const pendingBudgetImpact = (isDeposit || isBudgetExcludedCategory(pendingCategory)) ? 0 : pendingCost;
  const periodKey = getPeriodKey(actionDate);
  const periodStart = parsePeriodStart(periodKey) || new Date(actionDate.getFullYear(), actionDate.getMonth(), 1);
  const periodEnd = getMonthEnd(actionDate);
  const historicalTotals = buildHistoricalTotals(
    transactions,
    periodKey,
    actionDate,
    getBudgetPressureAmount,
  );
  const details = apiSimulation?.details || {};

  const fallbackCurrentValue = Array.from(historicalTotals.values()).reduce((sum, value) => sum + value, 0);
  const currentValue = toFiniteNumber(
    details.current_spent_this_period,
    fallbackCurrentValue,
  );
  const projectedValue = toFiniteNumber(
    details.projected_spent_this_period,
    currentValue + pendingBudgetImpact,
  );
  const decisionDelta = roundCurrency(projectedValue - currentValue);
  const observedDays = Math.max(1, actionDate.getDate());
  const averageDailyChange = roundCurrency(currentValue / observedDays);
  const budgetLimit = toFiniteNumber(details.budget_limit, null);

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

  let rollingBaseline = roundCurrency(currentValue);
  let rollingDecision = roundCurrency(currentValue + decisionDelta);

  if (chartData.length > 0) {
    chartData[chartData.length - 1] = {
      ...chartData[chartData.length - 1],
      baseline: rollingBaseline,
      decision: rollingDecision,
      deltaFromBaseline: decisionDelta,
      isActionDate: true,
    };
    values.push(rollingBaseline, rollingDecision);
  }

  cursor = addDays(actionDate, 1);

  while (cursor && cursor <= periodEnd) {
    rollingBaseline = roundCurrency(rollingBaseline + averageDailyChange);
    rollingDecision = roundCurrency(rollingDecision + averageDailyChange);
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

  const remainingBudget = toFiniteNumber(details.remaining_budget_after_purchase, null);
  const usageBefore = toFiniteNumber(details.current_percentage_used, null);
  const usageAfter = toFiniteNumber(details.projected_percentage_used, null);
  const riskLevel = String(details.risk_level || "unknown");
  const riskScore = toFiniteNumber(apiSimulation?.risk_score, null);
  const scenarios = normalizeScenarios(currentValue, details.scenarios || []);

  return {
    actionDate: toISODate(actionDate),
    averageDailyChange,
    budgetLimit,
    chartReferenceValue: budgetLimit,
    chartData,
    chartDomain: calculateDomain(values, budgetLimit),
    chartKey: `${periodKey}-${toISODate(actionDate)}-${decisionDelta}`,
    currentMetricValue: roundCurrency(currentValue),
    decisionDelta,
    isDeposit,
    labels: {
      currentMetric: "Current period total",
      projectedMetric: "After this action",
      impactMetric: "Decision impact",
      statusMetric: "Risk level",
      secondaryDescription: "Preview how this action changes your period trajectory before you commit it.",
    },
    projectedMetricValue: roundCurrency(projectedValue),
    rawAnalysis: apiSimulation,
    recommendation: {
      headline: apiSimulation?.recommendation || "Preview generated successfully.",
      detail: apiSimulation?.explanation || "Review the projected impact before saving.",
      status: resolveRecommendationStatus({
        decisionDelta,
        projectedUsage: usageAfter,
        remainingBudget,
        riskLevel,
        riskScore,
      }),
    },
    remainingBudget,
    riskLevel,
    scenarios,
    usageAfter,
    usageBefore,
    viewMode: "budget",
  };
}

