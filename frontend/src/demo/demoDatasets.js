function getPeriodKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftDays(baseDate, offset) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
}

function shiftMonths(baseDate, offset) {
  const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
  return getPeriodKey(nextDate);
}

export function createInitialDemoDataset(baseDate = new Date()) {
  const currentPeriod = shiftMonths(baseDate, 0);
  const previousPeriod = shiftMonths(baseDate, -1);

  return {
    budget: [
      {
        id: "demo-budget-current",
        amount: 1800,
        period: currentPeriod,
        user_id: 999,
      },
      {
        id: "demo-budget-previous",
        amount: 1700,
        period: previousPeriod,
        user_id: 999,
      },
    ],
    transactions: [
      {
        id: "demo-income-1",
        cost: 1500,
        date: shiftDays(baseDate, -8),
        store_name: "Acme Payroll",
        category: "Income",
        user_id: 999,
      },
      {
        id: "demo-expense-1",
        cost: -200,
        date: shiftDays(baseDate, -6),
        store_name: "Fresh Market",
        category: "Groceries",
        user_id: 999,
      },
      {
        id: "demo-expense-2",
        cost: -100,
        date: shiftDays(baseDate, -4),
        store_name: "Netflix",
        category: "Subscription - Entertainment",
        user_id: 999,
      },
      {
        id: "demo-expense-3",
        cost: -60,
        date: shiftDays(baseDate, -2),
        store_name: "Shell",
        category: "Gas",
        user_id: 999,
      },
      {
        id: "demo-expense-4",
        cost: -45,
        date: shiftDays(baseDate, -1),
        store_name: "Sweetgreen",
        category: "Dining",
        user_id: 999,
      },
    ],
    predictions: [
      {
        id: "demo-prediction-1",
        name: "Utility bill",
        amount: -85,
      },
      {
        id: "demo-prediction-2",
        name: "Weekend dining",
        amount: -40,
      },
    ],
    anomalies: [
      {
        merchant: "Fresh Market",
        category: "Groceries",
        actual_amount: 200,
        expected_amount: 95,
        anomaly_type: "Spike",
        date: shiftDays(baseDate, -6),
      },
    ],
  };
}

