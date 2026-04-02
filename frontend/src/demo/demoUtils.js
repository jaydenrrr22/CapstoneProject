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
    .reduce((sum, transaction) => sum + Number(transaction.cost || 0), 0);

  const percentageUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
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
