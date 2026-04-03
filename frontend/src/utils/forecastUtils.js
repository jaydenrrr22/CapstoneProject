const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const preciseCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const axisDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const FORECAST_HORIZONS = ["1M", "3M", "6M", "1Y"];

export function formatCurrency(value, { precise = false } = {}) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return precise ? "$0.00" : "$0";
  }

  return precise
    ? preciseCurrencyFormatter.format(numericValue)
    : currencyFormatter.format(numericValue);
}

export function formatCurrencyDelta(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return "$0";
  }

  return `${numericValue > 0 ? "+" : "-"}${formatCurrency(Math.abs(numericValue))}`;
}

export function formatAxisDate(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  return axisDateFormatter.format(date);
}

export function formatTooltipDate(value) {
  const date = toDate(value);

  if (!date) {
    return "Unknown date";
  }

  return tooltipDateFormatter.format(date);
}

export function parsePeriodStart(period) {
  if (!/^\d{4}-\d{2}$/.test(String(period || ""))) {
    return null;
  }

  const date = new Date(`${period}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getPeriodKey(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getCurrentPeriodKey() {
  return getPeriodKey(new Date());
}

export function resolveDefaultPeriod(periods = [], preferredPeriod = "") {
  if (preferredPeriod && periods.includes(preferredPeriod)) {
    return preferredPeriod;
  }

  const currentPeriod = getCurrentPeriodKey();

  if (periods.includes(currentPeriod)) {
    return currentPeriod;
  }

  return periods[0] || "";
}

export function toISODate(value) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value, amount) {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function addMonths(value, amount) {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  const originalDay = date.getDate();
  const nextDate = new Date(date.getTime());

  // Move to the first of the month before adjusting the month to avoid day overflow,
  // then clamp the day to the last valid day of the target month.
  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + amount);
  const lastDayOfMonth = new Date(
    nextDate.getFullYear(),
    nextDate.getMonth() + 1,
    0
  ).getDate();
  nextDate.setDate(Math.min(originalDay, lastDayOfMonth));
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function differenceInDays(startValue, endValue) {
  const start = toDate(startValue);
  const end = toDate(endValue);

  if (!start || !end) {
    return 0;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

export function toDate(value) {
  if (value instanceof Date) {
    const cloned = new Date(value);
    cloned.setHours(0, 0, 0, 0);
    return Number.isNaN(cloned.getTime()) ? null : cloned;
  }

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
