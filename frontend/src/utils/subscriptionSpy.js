const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DEFAULT_GUIDE = {
  provider: "Merchant account billing",
  cancelPath: "Open the merchant account, then look for Billing, Plans, Membership, or Subscriptions to stop renewal.",
  watchout: "If the service was purchased through Apple App Store or Google Play, cancellation may need to happen in that store instead of the merchant website.",
};

const MERCHANT_GUIDES = [
  {
    patterns: ["spotify"],
    provider: "Spotify",
    cancelPath: "Account -> Your plan -> Change plan -> Cancel Premium.",
    watchout: "Spotify cannot cancel plans billed through Apple or Google. Check that billing channel first.",
  },
  {
    patterns: ["icloud", "apple", "apple.com/bill"],
    provider: "Apple subscriptions",
    cancelPath: "iPhone Settings -> Apple ID -> Subscriptions, or use App Store account subscriptions on desktop.",
    watchout: "Many Apple-billed services will not show a cancel option on the merchant website.",
  },
  {
    patterns: ["netflix"],
    provider: "Netflix",
    cancelPath: "Account -> Membership and Billing -> Cancel Membership.",
    watchout: "If Netflix is bundled through a cable, carrier, or app store plan, cancel through that billing provider.",
  },
  {
    patterns: ["hulu", "disney", "disney+", "espn+"],
    provider: "Disney streaming billing",
    cancelPath: "Account -> Subscription or Billing Details -> Cancel subscription.",
    watchout: "Bundle plans may affect more than one service, so confirm what else changes before canceling.",
  },
  {
    patterns: ["amazon prime", "prime video", "amazon"],
    provider: "Amazon",
    cancelPath: "Prime Membership or Memberships and Subscriptions -> Manage membership -> End membership.",
    watchout: "Amazon often separates Prime, Prime Video channels, and standalone subscriptions.",
  },
  {
    patterns: ["adobe"],
    provider: "Adobe",
    cancelPath: "Account -> Plans -> Manage plan -> Cancel your plan.",
    watchout: "Adobe plans can have renewal terms or early termination fees depending on the contract.",
  },
  {
    patterns: ["youtube", "youtube premium", "google one", "google"],
    provider: "Google subscriptions",
    cancelPath: "Google account payments center or Google Play -> Subscriptions -> Cancel.",
    watchout: "Check whether the charge is billed by Google Play or directly by the service.",
  },
  {
    patterns: ["microsoft", "xbox", "office 365"],
    provider: "Microsoft",
    cancelPath: "Microsoft account -> Services and subscriptions -> Manage -> Cancel.",
    watchout: "Some Microsoft plans renew annually rather than monthly.",
  },
  {
    patterns: ["dropbox"],
    provider: "Dropbox",
    cancelPath: "Account -> Plan -> Manage plan -> Downgrade or cancel renewal.",
    watchout: "If Dropbox billing came through mobile app stores, cancel there instead.",
  },
  {
    patterns: ["canva"],
    provider: "Canva",
    cancelPath: "Account Settings -> Billing and plans -> Cancel plan.",
    watchout: "Team plans may affect other seats, so verify workspace ownership before canceling.",
  },
];

export const SUBSCRIPTION_SPY_FILTERS = [
  { id: "all", label: "All" },
  { id: "priority", label: "Review Now" },
  { id: "duplicate", label: "Duplicate Risk" },
  { id: "high-cost", label: "High Cost" },
  { id: "cancel-soon", label: "Cancel Soon" },
];

function normalizeMerchant(value) {
  return String(value || "").trim().toLowerCase();
}

function getAmount(value) {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getTransactionChargeAmount(transaction) {
  const amount = getAmount(transaction?.cost);
  return amount < 0 ? Math.abs(amount) : 0;
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const normalizedValue = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00`
    : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? DATE_FORMATTER.format(date) : "Unavailable";
}

function addDays(value, amount) {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function differenceInDays(startValue, endValue) {
  const startDate = toDate(startValue);
  const endDate = toDate(endValue);

  if (!startDate || !endDate) {
    return null;
  }

  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

function getAverageIntervalDays(transactions) {
  if (transactions.length < 2) {
    return null;
  }

  let total = 0;
  let intervals = 0;

  for (let index = 1; index < transactions.length; index += 1) {
    const previousDate = toDate(transactions[index - 1]?.date);
    const currentDate = toDate(transactions[index]?.date);

    if (!previousDate || !currentDate) {
      continue;
    }

    total += differenceInDays(previousDate, currentDate) || 0;
    intervals += 1;
  }

  if (intervals === 0) {
    return null;
  }

  return Math.max(1, Math.round(total / intervals));
}

function resolveGuide(merchant) {
  const normalizedMerchant = normalizeMerchant(merchant);
  const matchingGuide = MERCHANT_GUIDES.find((guide) =>
    guide.patterns.some((pattern) => normalizedMerchant.includes(pattern))
  );

  return matchingGuide || DEFAULT_GUIDE;
}

function getMatchingTransactions(subscription, transactions) {
  const amount = getAmount(subscription?.amount);
  const normalizedMerchant = normalizeMerchant(subscription?.merchant);
  const transactionIdSet = new Set(
    Array.isArray(subscription?.transaction_ids)
      ? subscription.transaction_ids.map((id) => String(id))
      : []
  );

  return [...(transactions || [])]
    .filter((transaction) => {
      const transactionAmount = getTransactionChargeAmount(transaction);

      if (transactionAmount <= 0) {
        return false;
      }

      if (transactionIdSet.size > 0 && transactionIdSet.has(String(transaction?.id))) {
        return true;
      }

      return normalizeMerchant(transaction?.store_name) === normalizedMerchant
        && Math.abs(transactionAmount - amount) < 0.005;
    })
    .sort((left, right) => new Date(left.date) - new Date(right.date));
}

function getFlagLabel(subscription) {
  if (String(subscription?.frequency || "").toLowerCase() === "marked") {
    return "Marked";
  }

  if (subscription?.is_duplicate) {
    return "Duplicate Risk";
  }

  return "Detected";
}

function getFrequencyLabel(subscription, averageIntervalDays) {
  const normalizedFrequency = String(subscription?.frequency || "").trim().toLowerCase();

  if (normalizedFrequency === "monthly") {
    return "Monthly";
  }

  if (normalizedFrequency === "marked") {
    return averageIntervalDays && averageIntervalDays >= 25 && averageIntervalDays <= 35
      ? "Monthly"
      : "Marked";
  }

  if (averageIntervalDays && averageIntervalDays >= 25 && averageIntervalDays <= 35) {
    return "Monthly";
  }

  return normalizedFrequency ? String(subscription.frequency) : "Unknown";
}

function buildUseCase({
  annualCost,
  daysUntilNextCharge,
  frequencyLabel,
  isDuplicate,
  matchedChargeCount,
}) {
  if (isDuplicate) {
    return {
      label: "Duplicate cleanup",
      detail: "Matching charges are landing too close together. Review whether two plans, family seats, or a failed retry created an extra bill.",
    };
  }

  if (annualCost >= 180) {
    return {
      label: "Budget trim",
      detail: "This is one of the more expensive recurring charges in your ledger. Canceling it would free up meaningful room over the year.",
    };
  }

  if (daysUntilNextCharge !== null && daysUntilNextCharge <= 7) {
    return {
      label: "Charge coming soon",
      detail: "If you no longer use this service, cancel before the next renewal window to avoid another cycle.",
    };
  }

  if (frequencyLabel === "Marked" || matchedChargeCount <= 1) {
    return {
      label: "Cadence review",
      detail: "This looks manually marked or lightly evidenced. Confirm the billing cadence before building budget assumptions around it.",
    };
  }

  return {
    label: "Routine check-in",
    detail: "Recurring billing appears stable. Decide whether it still earns a place in your month before the next cycle lands.",
  };
}

function buildRecommendation({
  annualCost,
  daysUntilNextCharge,
  frequencyLabel,
  isDuplicate,
  merchant,
  nextChargeDate,
}) {
  if (isDuplicate) {
    return {
      headline: "Potential duplicate billing spotted.",
      detail: `Compare active plans for ${merchant || "this merchant"} and keep only the one you intend to pay for.`,
      statusTone: "warning",
      priority: 4,
    };
  }

  if (daysUntilNextCharge !== null && daysUntilNextCharge <= 7) {
    return {
      headline: `Next charge likely around ${formatDate(nextChargeDate)}.`,
      detail: "Cancel now if you are done with the service so the next billing cycle does not hit.",
      statusTone: "warning",
      priority: 3,
    };
  }

  if (annualCost >= 180) {
    return {
      headline: `This recurring charge is about $${annualCost.toFixed(2)} per year.`,
      detail: "High-cost recurring services are usually the fastest way to reclaim budget without changing lots of smaller habits.",
      statusTone: "risk",
      priority: 2,
    };
  }

  if (frequencyLabel === "Marked") {
    return {
      headline: "Manually marked subscription needs a quick verification.",
      detail: "Double-check whether the service is truly recurring and whether the amount is still current.",
      statusTone: "neutral",
      priority: 1,
    };
  }

  return {
    headline: "Recurring pattern looks stable.",
    detail: "Keep it if it still delivers value, or cancel before the next renewal if it has gone stale.",
    statusTone: "positive",
    priority: 0,
  };
}

export function buildSubscriptionSpyReports({ subscriptions = [], transactions = [] }) {
  return subscriptions
    .map((subscription, index) => {
      const merchant = subscription?.merchant || "Subscription";
      const amount = getAmount(subscription?.amount);
      const matchingTransactions = getMatchingTransactions(subscription, transactions);
      const matchedChargeCount = Math.max(
        matchingTransactions.length,
        Number(subscription?.charge_count) || 0,
        Array.isArray(subscription?.transaction_ids) ? subscription.transaction_ids.length : 0,
        1
      );
      const averageIntervalDays = getAverageIntervalDays(matchingTransactions)
        || Number(subscription?.average_interval_days)
        || null;
      const frequencyLabel = getFrequencyLabel(subscription, averageIntervalDays);
      const lastCharge = matchingTransactions[matchingTransactions.length - 1] || null;
      const lastChargeSource = lastCharge?.date || subscription?.last_charge_date || null;
      const rawNextChargeDate = averageIntervalDays
        ? addDays(lastChargeSource, averageIntervalDays)
        : frequencyLabel === "Monthly"
          ? addDays(lastChargeSource, 30)
          : null;
      const rawDaysUntilNextCharge = rawNextChargeDate
        ? differenceInDays(new Date(), rawNextChargeDate)
        : null;
      const nextChargeDate = rawDaysUntilNextCharge !== null && rawDaysUntilNextCharge >= 0
        ? rawNextChargeDate
        : null;
      const daysUntilNextCharge = nextChargeDate
        ? rawDaysUntilNextCharge
        : null;
      const annualCost = frequencyLabel === "Monthly" || frequencyLabel === "Marked"
        ? amount * 12
        : averageIntervalDays && averageIntervalDays >= 25 && averageIntervalDays <= 35
          ? amount * 12
          : amount * 12;
      const guide = resolveGuide(merchant);
      const useCase = buildUseCase({
        annualCost,
        daysUntilNextCharge,
        frequencyLabel,
        isDuplicate: Boolean(subscription?.is_duplicate),
        matchedChargeCount,
      });
      const recommendation = buildRecommendation({
        annualCost,
        daysUntilNextCharge,
        frequencyLabel,
        isDuplicate: Boolean(subscription?.is_duplicate),
        merchant,
        nextChargeDate,
      });

      return {
        id: subscription?.id || `${normalizeMerchant(merchant)}-${amount.toFixed(2)}-${index}`,
        merchant,
        amount,
        annualCost,
        averageIntervalDays,
        daysUntilNextCharge,
        flagLabel: getFlagLabel(subscription),
        frequencyLabel,
        guide,
        isCancelSoon: daysUntilNextCharge !== null && daysUntilNextCharge <= 7,
        isDuplicate: Boolean(subscription?.is_duplicate),
        isHighCost: annualCost >= 180 || amount >= 20,
        lastChargeDateLabel: lastChargeSource ? formatDate(lastChargeSource) : "Unavailable",
        matchedChargeCount,
        nextChargeDateLabel: nextChargeDate ? formatDate(nextChargeDate) : "Monitor manually",
        recentCharges: matchingTransactions
          .slice(-3)
          .reverse()
          .map((transaction) => ({
            id: transaction.id || `${merchant}-${transaction.date}`,
            amount: getTransactionChargeAmount(transaction),
            dateLabel: formatDate(transaction.date),
          })),
        recommendation,
        statusTone: recommendation.statusTone,
        useCase,
      };
    })
    .sort((left, right) => {
      const priorityDifference = right.recommendation.priority - left.recommendation.priority;

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return right.amount - left.amount;
    });
}

export function buildSubscriptionSpySummary(reports = []) {
  const summary = reports.reduce((accumulator, report) => {
    accumulator.monthlyTotal += report.amount;
    accumulator.annualTotal += report.annualCost;

    if (report.isDuplicate) {
      accumulator.duplicateCount += 1;
      accumulator.priorityCount += 1;
    }

    if (report.isHighCost) {
      accumulator.highCostCount += 1;
    }

    if (report.isCancelSoon) {
      accumulator.cancelSoonCount += 1;
      accumulator.priorityCount += 1;
    }

    return accumulator;
  }, {
    annualTotal: 0,
    cancelSoonCount: 0,
    duplicateCount: 0,
    highCostCount: 0,
    monthlyTotal: 0,
    priorityCount: 0,
  });

  return {
    ...summary,
    count: reports.length,
  };
}

export function filterSubscriptionSpyReports(reports = [], filterId = "all") {
  switch (filterId) {
    case "priority":
      return reports.filter((report) => report.isDuplicate || report.isCancelSoon);
    case "duplicate":
      return reports.filter((report) => report.isDuplicate);
    case "high-cost":
      return reports.filter((report) => report.isHighCost);
    case "cancel-soon":
      return reports.filter((report) => report.isCancelSoon);
    default:
      return reports;
  }
}
