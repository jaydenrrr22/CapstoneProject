export function toSignedAmount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
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

export function getBudgetPressureAmount(value) {
  const amount = toSignedAmount(value);

  if (amount < 0) {
    return Math.abs(amount);
  }

  if (amount > 0) {
    return -amount;
  }

  return 0;
}

