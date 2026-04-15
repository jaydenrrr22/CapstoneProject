import { formatCurrency, toDate } from "../../utils/forecastUtils";
import {
  calculateBudgetUsagePercentage,
  getBudgetPressureAmount,
  getExpenseAmount,
  isIncomeAmount,
  toSignedAmount,
} from "../../utils/finance";

function parsePeriod(period) {
  if (!period || !/^\d{4}-\d{2}$/.test(String(period))) {
    return null;
  }

  const [year, month] = String(period).split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getPreviousPeriod(period) {
  const periodDate = parsePeriod(period);

  if (!periodDate) {
    return "";
  }

  const previous = new Date(periodDate.getFullYear(), periodDate.getMonth() - 1, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthDayLabel(date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

function clampPercentage(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function normalizePercentage(value) {
  return Math.max(0, Number(value || 0));
}

export function formatSignedCurrency(value) {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return "--";
  }

  return `${numericValue < 0 ? "-" : "+"}${formatCurrency(Math.abs(numericValue), { precise: true })}`;
}

export function getPeriodTransactions(transactions = [], period = "") {
  return (transactions || []).filter((transaction) => String(transaction?.date || "").startsWith(period));
}

export function getPeriodNet(transactions = [], period = "") {
  return getPeriodTransactions(transactions, period).reduce(
    (sum, transaction) => sum + toSignedAmount(transaction?.cost ?? transaction?.amount ?? 0),
    0
  );
}

export function buildNetDelta(period, transactions = []) {
  const currentNet = getPeriodNet(transactions, period);
  const previousNet = getPeriodNet(transactions, getPreviousPeriod(period));

  if (!Number.isFinite(previousNet) || previousNet === 0) {
    return {
      currentNet,
      deltaLabel: "No prior month baseline",
      direction: "neutral",
    };
  }

  const percentageChange = ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
  const roundedChange = Math.abs(percentageChange).toFixed(0);
  const direction = percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";
  const prefix = percentageChange > 0 ? "Up" : percentageChange < 0 ? "Down" : "Flat";

  return {
    currentNet,
    deltaLabel: `${prefix} ${roundedChange}% vs last month`,
    direction,
  };
}

export function buildBudgetProgress(period, budgetLimit, health, transactions = []) {
  if (!period || !Number.isFinite(Number(budgetLimit)) || Number(budgetLimit) < 0) {
    return null;
  }

  const periodDate = parsePeriod(period);

  if (!periodDate) {
    return null;
  }

  const totalSpent = health
    ? Number(health.total_spent || 0)
    : getPeriodTransactions(transactions, period).reduce(
      (sum, transaction) => sum + getBudgetPressureAmount(
        transaction?.cost ?? transaction?.amount ?? 0,
        transaction?.category
      ),
      0
    );
  const percentageUsed = health
    ? normalizePercentage(health.percentage_used)
    : normalizePercentage(calculateBudgetUsagePercentage(totalSpent, Number(budgetLimit)));
  const fillPercentage = clampPercentage(percentageUsed);
  const daysInMonth = getDaysInMonth(periodDate);
  const dayProgress = 100;
  const remaining = Number(budgetLimit) - totalSpent;
  const isOverBudget = remaining < 0 || percentageUsed > 100;
  const overBudgetAmount = isOverBudget ? Math.abs(Math.min(remaining, 0)) : 0;
  const paceDelta = percentageUsed - 100;

  let paceStatus = "Within budget";
  let tone = "positive";

  if (isOverBudget) {
    paceStatus = "Over budget";
    tone = "negative";
  } else if (percentageUsed >= 90) {
    paceStatus = "Near budget limit";
    tone = "negative";
  } else if (percentageUsed >= 70) {
    paceStatus = "Tracking to budget";
    tone = "neutral";
  }

  return {
    dayLabel: `Full month (${daysInMonth} days)`,
    dayProgress,
    fillPercentage,
    isOverBudget,
    overBudgetAmount,
    paceDelta,
    paceStatus,
    percentageUsed,
    remaining,
    spent: totalSpent,
    tone,
  };
}

export function buildFreshnessLabel(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return "Waiting for data";
  }

  const updatedDate = new Date(lastUpdatedAt);
  const diffMs = Math.max(0, Date.now() - updatedDate.getTime());
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Synced just now";
  }

  if (diffMinutes < 60) {
    return `Synced ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  return `Synced ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
}

export function buildPulseBar({
  budgetProgress,
  anomalies = [],
  predictionCount = 0,
  selectedPeriod = "",
  subscriptionCount = 0,
  subscriptionTotal = 0,
}) {
  if (anomalies.length > 0) {
    const leadAnomaly = anomalies[0];
    return {
      tone: "warning",
      title: "Needs attention",
      message: `${anomalies.length} unusual charge${anomalies.length === 1 ? "" : "s"} detected. ${leadAnomaly.merchant} landed at ${formatCurrency(leadAnomaly.actual_amount, { precise: true })} versus the usual ${formatCurrency(leadAnomaly.expected_amount, { precise: true })}.`,
    };
  }

  if (budgetProgress) {
    if (budgetProgress.isOverBudget) {
      return {
        tone: "warning",
        title: "Budget exceeded",
        message: `You're over budget by ${formatCurrency(budgetProgress.overBudgetAmount, { precise: true })} in ${selectedPeriod}. Pause new discretionary spend until the month resets.`,
      };
    }

    if (budgetProgress.percentageUsed >= 90) {
      return {
        tone: "warning",
        title: "Budget is nearly tapped",
        message: `${budgetProgress.percentageUsed.toFixed(0)}% of ${selectedPeriod} is allocated across the full month. ${formatCurrency(budgetProgress.remaining, { precise: true })} remains.`,
      };
    }

    if (budgetProgress.percentageUsed <= 70) {
      return {
        tone: "positive",
        title: "Budget has room",
        message: `${budgetProgress.percentageUsed.toFixed(0)}% of ${selectedPeriod} is allocated across the full month. ${formatCurrency(budgetProgress.remaining, { precise: true })} remains.`,
      };
    }

    return {
      tone: "neutral",
      title: "Budget is in range",
      message: `${budgetProgress.percentageUsed.toFixed(0)}% of ${selectedPeriod} is allocated across the full month. ${formatCurrency(budgetProgress.remaining, { precise: true })} remains.`,
    };
  }

  if (predictionCount > 0) {
    return {
      tone: "neutral",
      title: "Forward view",
      message: `Trace is monitoring ${predictionCount} modeled transaction${predictionCount === 1 ? "" : "s"} so upcoming charges are visible before they land.`,
    };
  }

  if (subscriptionCount > 0) {
    return {
      tone: "neutral",
      title: "Recurring spend tracked",
      message: `${subscriptionCount} recurring charge${subscriptionCount === 1 ? "" : "s"} detected, totaling about ${formatCurrency(subscriptionTotal, { precise: true })} per month.`,
    };
  }

  return {
    tone: "neutral",
    title: "Dashboard ready",
    message: "Trace is tracking this period's budget, transactions, and forward-looking signals in one place.",
  };
}

function buildNextBestAction({ anomalies = [], budgetProgress, selectedPeriod = "", subscriptionCount = 0 }) {
  if (anomalies.length > 0) {
    return {
      tone: "warning",
      title: `Review ${anomalies.length} flagged transaction${anomalies.length === 1 ? "" : "s"}`,
      detail: "Start with the latest anomaly to verify it belongs in this month's budget.",
      kind: "action",
    };
  }

  if (budgetProgress?.isOverBudget) {
    return {
      tone: "warning",
      title: "Rebalance this month's budget",
      detail: `You're already over budget by ${formatCurrency(budgetProgress.overBudgetAmount, { precise: true })} for ${selectedPeriod}. Prioritize trimming the next outgoing charges.`,
      kind: "action",
    };
  }

  if (budgetProgress?.percentageUsed >= 90) {
    return {
      tone: "warning",
      title: "Protect the remaining budget",
      detail: `Only ${formatCurrency(budgetProgress.remaining, { precise: true })} remains across the full ${selectedPeriod} month. Review non-essential charges before adding more spend.`,
      kind: "action",
    };
  }

  if (subscriptionCount > 0) {
    return {
      tone: "neutral",
      title: "Audit recurring charges",
      detail: "Recurring services are one of the fastest ways to reclaim budget without changing every purchase habit.",
      kind: "action",
    };
  }

  return {
    tone: "positive",
    title: "Stay the course",
    detail: "This period is stable. Keep logging transactions so the forecast and anomaly signals get sharper.",
    kind: "action",
  };
}

export function buildInsightsFeed({
  anomalies = [],
  budgetProgress,
  predictions = [],
  selectedPeriod = "",
  subscriptionCount = 0,
  subscriptionTotal = 0,
}) {
  const items = [];

  if (anomalies.length > 0) {
    const leadAnomaly = anomalies[0];
    items.push({
      tone: "warning",
      title: `${leadAnomaly.anomaly_type} detected at ${leadAnomaly.merchant}`,
      detail: `${formatCurrency(leadAnomaly.actual_amount, { precise: true })} posted on ${leadAnomaly.date} versus the expected ${formatCurrency(leadAnomaly.expected_amount, { precise: true })}.`,
      kind: "anomaly",
    });
  }

  if (subscriptionCount > 0) {
    items.push({
      tone: "neutral",
      title: `${subscriptionCount} recurring subscription${subscriptionCount === 1 ? "" : "s"} identified`,
      detail: `Detected recurring charges add up to about ${formatCurrency(subscriptionTotal, { precise: true })} per month.`,
      kind: "subscription",
    });
  }

  if (predictions.length > 0) {
    const topPrediction = predictions
      .slice()
      .sort((left, right) => Math.abs(Number(right.amount || 0)) - Math.abs(Number(left.amount || 0)))[0];

    items.push({
      tone: "neutral",
      title: `Predicted charge: ${topPrediction.name || "Upcoming transaction"}`,
      detail: `${formatSignedCurrency(Number(topPrediction.amount || 0))} is currently the strongest modeled movement for the next window.`,
      kind: "prediction",
    });
  }

  if (budgetProgress) {
    items.push({
      tone: budgetProgress.tone,
      title: `Budget status is ${budgetProgress.paceStatus.toLowerCase()}`,
      detail: budgetProgress.isOverBudget
        ? `${budgetProgress.dayLabel}. ${budgetProgress.percentageUsed.toFixed(0)}% of the budget is used for ${selectedPeriod}, which is ${formatCurrency(budgetProgress.overBudgetAmount, { precise: true })} over budget.`
        : `${budgetProgress.dayLabel}. ${budgetProgress.percentageUsed.toFixed(0)}% of the budget is used for ${selectedPeriod}, leaving ${formatCurrency(budgetProgress.remaining, { precise: true })} for the rest of the month.`,
      kind: "budget",
    });
  }

  items.push(buildNextBestAction({
    anomalies,
    budgetProgress,
    selectedPeriod,
    subscriptionCount,
  }));

  return items.slice(0, 5);
}

export function buildTransactionAnnotations(transactions = [], anomalies = []) {
  const anomalyLookup = new Map(
    (anomalies || []).map((anomaly) => {
      const key = [
        String(anomaly.merchant || "").trim().toLowerCase(),
        String(anomaly.date || ""),
        Number(anomaly.actual_amount || 0).toFixed(2),
      ].join("::");

      return [key, anomaly];
    })
  );

  return (transactions || []).map((transaction) => {
    const numericAmount = getExpenseAmount(transaction?.cost);
    const key = [
      String(transaction?.store_name || "").trim().toLowerCase(),
      String(transaction?.date || ""),
      numericAmount.toFixed(2),
    ].join("::");
    const anomaly = anomalyLookup.get(key) || null;

    return {
      amount: toSignedAmount(transaction?.cost ?? transaction?.amount ?? 0),
      anomaly,
      category: transaction?.category || "Uncategorized",
      date: transaction?.date || "",
      id: transaction?.id,
      isIncome: isIncomeAmount(transaction?.cost ?? transaction?.amount ?? 0),
      merchant: transaction?.store_name || "Transaction",
    };
  });
}

export function buildSpendTimeline(period, transactions = []) {
  const periodDate = parsePeriod(period);

  if (!periodDate) {
    return [];
  }

  const monthEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);

  if (monthEnd < periodDate) {
    return [];
  }

  const buckets = [];
  let cursor = new Date(periodDate);

  while (cursor <= monthEnd) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + 6);

    if (bucketEnd > monthEnd) {
      bucketEnd.setTime(monthEnd.getTime());
    }

    buckets.push({
      end: bucketEnd,
      label: `${toMonthDayLabel(bucketStart)}-${bucketEnd.getDate()}`,
      spend: 0,
      start: bucketStart,
    });

    cursor = new Date(bucketEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  getPeriodTransactions(transactions, period).forEach((transaction) => {
    const dateValue = toDate(transaction.date);

    if (!dateValue) {
      return;
    }

    const matchingBucket = buckets.find(
      (bucket) => dateValue >= bucket.start && dateValue <= bucket.end
    );

    if (!matchingBucket) {
      return;
    }

    matchingBucket.spend = Number(
      (
        matchingBucket.spend
        + getBudgetPressureAmount(transaction?.cost ?? transaction?.amount ?? 0, transaction?.category)
      ).toFixed(2)
    );
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    spend: bucket.spend,
  }));
}

