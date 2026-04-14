import { getBudgetPressureAmount, getExpenseAmount } from "../utils/finance";

export function getBudgetLimitMap(budgets = []) {
  return budgets.reduce((accumulator, budget) => {
    const numericAmount = Number(budget.amount);

    if (budget?.period && Number.isFinite(numericAmount)) {
      accumulator[budget.period] = numericAmount;
    }

    return accumulator;
  }, {});
}

export function getAvailablePeriods(budgets = []) {
  return [...new Set(budgets.map((budget) => budget.period))].sort((left, right) =>
    right.localeCompare(left)
  );
}

export function detectDemoSubscriptions(transactions = []) {
  const normalizedTransactions = [...transactions]
    .filter((transaction) => getExpenseAmount(transaction?.cost) > 0)
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const groupedTransactions = normalizedTransactions.reduce((accumulator, transaction) => {
    const merchant = String(transaction.store_name || "").trim();
    const amount = getExpenseAmount(transaction.cost);

    if (!merchant || !Number.isFinite(amount) || amount <= 0) {
      return accumulator;
    }

    const key = `${merchant.toLowerCase()}::${amount.toFixed(2)}`;
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(transaction);
    return accumulator;
  }, {});

  const detected = [];

  Object.values(groupedTransactions).forEach((entries) => {
    if (entries.length < 2) {
      return;
    }

    let isMonthly = true;
    let isDuplicate = false;
    let totalIntervalDays = 0;
    let intervalCount = 0;

    for (let index = 1; index < entries.length; index += 1) {
      const previousDate = new Date(entries[index - 1].date);
      const currentDate = new Date(entries[index].date);
      const diffInDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
      totalIntervalDays += diffInDays;
      intervalCount += 1;

      if (diffInDays <= 3) {
        isDuplicate = true;
      } else if (diffInDays < 25 || diffInDays > 35) {
        isMonthly = false;
      }
    }

    if (!isMonthly && !isDuplicate) {
      return;
    }

    detected.push({
      merchant: entries[0].store_name,
      amount: getExpenseAmount(entries[0].cost),
      average_interval_days: intervalCount > 0 ? Math.round(totalIntervalDays / intervalCount) : null,
      charge_count: entries.length,
      first_charge_date: entries[0].date,
      frequency: isMonthly ? "Monthly" : "Unknown",
      is_duplicate: isDuplicate,
      last_charge_date: entries[entries.length - 1].date,
      transaction_ids: entries.map((entry) => entry.id),
    });
  });

  normalizedTransactions.forEach((transaction) => {
    const category = String(transaction.category || "").trim().toLowerCase();

    if (!category.includes("subscription")) {
      return;
    }

    const alreadyDetected = detected.some(
      (entry) => entry.merchant.toLowerCase() === String(transaction.store_name || "").trim().toLowerCase()
        && Number(entry.amount || 0) === getExpenseAmount(transaction.cost)
    );

    if (!alreadyDetected) {
      detected.push({
        merchant: transaction.store_name,
        amount: getExpenseAmount(transaction.cost),
        average_interval_days: null,
        charge_count: 1,
        first_charge_date: transaction.date,
        frequency: "Marked",
        is_duplicate: false,
        last_charge_date: transaction.date,
        transaction_ids: [transaction.id],
      });
    }
  });

  return detected.sort((left, right) => {
    const duplicateDifference = Number(Boolean(right.is_duplicate)) - Number(Boolean(left.is_duplicate));

    if (duplicateDifference !== 0) {
      return duplicateDifference;
    }

    return String(left.merchant || "").localeCompare(String(right.merchant || ""));
  });
}

function resolveDemoFrequencyMultiplier(frequency = "one_time") {
  switch (String(frequency).toLowerCase()) {
    case "monthly":
      return { monthly: 1, yearly: 12 };
    case "weekly":
      return { monthly: 4.33, yearly: 52 };
    case "yearly":
      return { monthly: 1 / 12, yearly: 1 };
    default:
      return { monthly: 1, yearly: 1 };
  }
}

function resolveRiskLevel(percentageUsed) {
  if (percentageUsed >= 90) {
    return "Risk";
  }

  if (percentageUsed >= 70) {
    return "Moderate";
  }

  return "Good";
}

function resolveRiskScore({ projectedPercentageUsed, remainingBudget, transactionType }) {
  const usageRatio = Math.max(0, Math.min(1, Number(projectedPercentageUsed || 0) / 100));

  if (String(transactionType).toLowerCase() === "deposit") {
    return Number((usageRatio * 0.35).toFixed(4));
  }

  if (projectedPercentageUsed > 100 || remainingBudget < 0) {
    return Number(Math.max(0.88, usageRatio).toFixed(4));
  }

  if (projectedPercentageUsed >= 70) {
    return Number(Math.max(0.45, usageRatio * 0.8).toFixed(4));
  }

  return Number(Math.max(0.12, usageRatio * 0.45).toFixed(4));
}

export function buildDemoSimulationResponse({
  budgets = [],
  transactions = [],
  actionDate,
  amount,
  merchant = "",
  category = "",
  transactionType = "spend",
  frequency = "one_time",
}) {
  const periodKey = String(actionDate || "").slice(0, 7);
  const matchingBudget = budgets.find((budget) => budget.period === periodKey) || budgets[0] || null;
  const budgetLimit = Number(matchingBudget?.amount || 0);
  const normalizedAmount = Math.abs(Number(amount || 0));
  const isDeposit = String(transactionType).toLowerCase() === "deposit";
  const { monthly: monthlyMultiplier, yearly: yearlyMultiplier } = resolveDemoFrequencyMultiplier(frequency);
  const projectedMonthlyCost = isDeposit
    ? -(normalizedAmount * monthlyMultiplier)
    : normalizedAmount * monthlyMultiplier;
  const projectedYearlyCost = isDeposit
    ? -(normalizedAmount * yearlyMultiplier)
    : normalizedAmount * yearlyMultiplier;
  const balanceChange = isDeposit
    ? normalizedAmount * monthlyMultiplier
    : -(normalizedAmount * monthlyMultiplier);

  const currentSpent = transactions
    .filter((transaction) => String(transaction.date || "").slice(0, 7) === periodKey)
    .reduce((sum, transaction) => sum + getBudgetPressureAmount(transaction.cost), 0);

  const projectedSpent = currentSpent + projectedMonthlyCost;
  const remainingBudget = budgetLimit - projectedSpent;
  const currentPercentageUsed = budgetLimit > 0 ? (Math.max(currentSpent, 0) / budgetLimit) * 100 : 0;
  const projectedPercentageUsed = budgetLimit > 0 ? (Math.max(projectedSpent, 0) / budgetLimit) * 100 : 0;

  const buildScenario = (label, multiplier) => {
    const scenarioProjected = currentSpent + (projectedMonthlyCost * multiplier);
    const scenarioPercentage = budgetLimit > 0 ? (Math.max(scenarioProjected, 0) / budgetLimit) * 100 : 0;

    return {
      balance_change: Number((balanceChange * multiplier).toFixed(2)),
      scenario_type: label,
      projected_spent_this_period: Number(scenarioProjected.toFixed(2)),
      remaining_budget_after_purchase: Number((budgetLimit - scenarioProjected).toFixed(2)),
      projected_percentage_used: Number(scenarioPercentage.toFixed(2)),
      risk_level: resolveRiskLevel(scenarioPercentage),
    };
  };

  const riskLevel = resolveRiskLevel(projectedPercentageUsed);
  const recommendation = isDeposit
    ? "Improves cash position"
    : projectedPercentageUsed >= 100 || remainingBudget < 0
      ? "Delay this decision"
      : projectedPercentageUsed >= 90
        ? "High budget risk"
        : projectedPercentageUsed >= 70
          ? "Monitor closely"
          : "Within budget";
  const explanation = isDeposit
    ? `This deposit reduces current-period budget pressure to ${projectedPercentageUsed.toFixed(1)}% and leaves $${remainingBudget.toFixed(2)} in the current period.`
    : projectedPercentageUsed >= 100 || remainingBudget < 0
      ? `This action would push projected budget use to ${projectedPercentageUsed.toFixed(1)}% and overshoot the budget by $${Math.abs(remainingBudget).toFixed(2)}.`
      : `This action leaves $${remainingBudget.toFixed(2)} available with projected budget use at ${projectedPercentageUsed.toFixed(1)}%.`;

  return {
    recommendation,
    explanation,
    risk_score: resolveRiskScore({
      projectedPercentageUsed,
      remainingBudget,
      transactionType,
    }),
    confidence: 0.88,
    timestamp: new Date().toISOString(),
    projected_impact: {
      balance_change: Number(balanceChange.toFixed(2)),
      budget_impact: Number((projectedPercentageUsed - currentPercentageUsed).toFixed(2)),
      category_effect: merchant || category || (isDeposit ? "Income" : "General spend"),
    },
    details: {
      analysis_type: "transaction_decision",
      current_period: periodKey || String(matchingBudget?.period || ""),
      action_date: actionDate || null,
      merchant: merchant || null,
      category: category || null,
      budget_limit: Number(budgetLimit.toFixed(2)),
      current_spent_this_period: Number(currentSpent.toFixed(2)),
      projected_spent_this_period: Number(projectedSpent.toFixed(2)),
      current_percentage_used: Number(currentPercentageUsed.toFixed(2)),
      projected_percentage_used: Number(projectedPercentageUsed.toFixed(2)),
      remaining_budget_after_purchase: Number(remainingBudget.toFixed(2)),
      risk_level: riskLevel,
      projected_monthly_spend_delta: Number(projectedMonthlyCost.toFixed(2)),
      projected_yearly_spend_delta: Number(projectedYearlyCost.toFixed(2)),
      scenarios: [
        buildScenario("Base Case", 1),
        buildScenario("Best Case", 0.85),
        buildScenario("Worst Case", 1.2),
      ],
    },
  };
}

export function getSubscriptionInsight(subscriptions = []) {
  return {
    count: subscriptions.length,
    totalMonthly: subscriptions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };
}

export function buildDemoHealth(period, budgetLimitsByPeriod, transactions = []) {
  const budgetLimit = Number(budgetLimitsByPeriod[period] || 0);

  if (!period || !budgetLimit) {
    return null;
  }

  const totalSpent = transactions
    .filter((transaction) => String(transaction.date || "").startsWith(period))
    .reduce((sum, transaction) => sum + getBudgetPressureAmount(transaction.cost), 0);

  const percentageUsed = budgetLimit > 0 ? (Math.max(totalSpent, 0) / budgetLimit) * 100 : 0;
  const remainingBalance = budgetLimit - totalSpent;

  let status = "Good";
  let score = 92;

  if (percentageUsed >= 90) {
    status = "Risk";
    score = 38;
  } else if (percentageUsed >= 70) {
    status = "Moderate";
    score = 68;
  }

  return {
    budget_limit: budgetLimit,
    period,
    percentage_used: percentageUsed,
    remaining_balance: remainingBalance,
    score,
    status,
    total_spent: totalSpent,
  };
}

export function buildDemoBudgetProgress(period, budgets = [], transactions = []) {
  const budget = (budgets || []).find((item) => item.period === period);

  if (!budget) {
    return null;
  }

  const budgetLimit = Number(budget.amount || 0);
  const totalSpent = (transactions || [])
    .filter((transaction) => String(transaction.date || "").startsWith(period))
    .reduce((sum, transaction) => sum + getBudgetPressureAmount(transaction.cost), 0);

  const percentageUsed = budgetLimit > 0 ? (Math.max(totalSpent, 0) / budgetLimit) * 100 : 0;
  const remainingBalance = budgetLimit - totalSpent;

  let status = "Good";

  if (percentageUsed >= 90) {
    status = "Risk";
  } else if (percentageUsed >= 70) {
    status = "Moderate";
  }

  return {
    budget_limit: budgetLimit,
    month: period,
    percentage_used: percentageUsed,
    remaining_balance: remainingBalance,
    status,
    total_spent: totalSpent,
  };
}

