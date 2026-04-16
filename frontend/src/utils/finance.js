export function toSignedAmount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

export function isBudgetExcludedCategory(category) {
  const normalized = normalizeCategory(category);
  return normalized.startsWith("transfer")
    || normalized.startsWith("investment")
    || normalized.startsWith("system");
}

export function isIncomeAmount(value) {
  return toSignedAmount(value) > 0;
}

export function isExpenseAmount(value) {
  return toSignedAmount(value) < 0;
}

export function getIncomeAmount(value) {
  const amount = toSignedAmount(value);
  return amount > 0 ? amount : 0;
}

export function getExpenseAmount(value) {
  const amount = toSignedAmount(value);
  return amount < 0 ? Math.abs(amount) : 0;
}

export function getNetCashFlowAmount(value) {
  return toSignedAmount(value);
}

export function getBudgetPressureAmount(value, category) {
  if (isBudgetExcludedCategory(category)) {
    return 0;
  }

  return getExpenseAmount(value);
}

export function calculateBudgetUsagePercentage(totalSpent, budgetLimit) {
  const normalizedSpent = Math.max(Number(totalSpent) || 0, 0);
  const normalizedBudget = Number(budgetLimit) || 0;

  if (normalizedBudget > 0) {
    return (normalizedSpent / normalizedBudget) * 100;
  }

  return normalizedSpent > 0 ? 100 : 0;
}

