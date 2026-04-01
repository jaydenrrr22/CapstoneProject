import { useMemo } from "react";
import {
  FORECAST_HORIZONS,
  addDays,
  addMonths,
  differenceInDays,
  formatAxisDate,
  getPeriodKey,
  parsePeriodStart,
  toDate,
  toISODate,
} from "../utils/forecastUtils";

const HORIZON_TO_MONTHS = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
};

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function toTransactionAmount(transaction) {
  const amount = Number(transaction?.cost ?? transaction?.amount ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export default function useForecastData({
  transactions = [],
  selectedPeriod,
  budgetLimit,
  horizon = FORECAST_HORIZONS[1],
}) {
  return useMemo(() => {
    if (!selectedPeriod) {
      return {
        averageDailyChange: 0,
        budgetReference: Number.isFinite(Number(budgetLimit)) ? Number(budgetLimit) : null,
        currentValue: 0,
        data: [],
        domain: [0, 100],
        emptyMessage: "Select a budget period to view a forecast.",
        isEmpty: true,
        projectedDelta: 0,
      };
    }

    const periodStart = parsePeriodStart(selectedPeriod);

    if (!periodStart) {
      return {
        averageDailyChange: 0,
        budgetReference: null,
        currentValue: 0,
        data: [],
        domain: [0, 100],
        emptyMessage: "This budget period could not be interpreted.",
        isEmpty: true,
        projectedDelta: 0,
      };
    }

    const filteredTransactions = transactions
      .map((transaction) => ({
        amount: toTransactionAmount(transaction),
        date: toDate(transaction?.date),
      }))
      .filter((transaction) => transaction.date && getPeriodKey(transaction.date) === selectedPeriod)
      .sort((left, right) => left.date - right.date);

    if (filteredTransactions.length === 0) {
      return {
        averageDailyChange: 0,
        budgetReference: Number.isFinite(Number(budgetLimit)) ? Number(budgetLimit) : null,
        currentValue: 0,
        data: [],
        domain: [0, Number(budgetLimit) || 100],
        emptyMessage: "No transactions are available for this period yet.",
        isEmpty: true,
        projectedDelta: 0,
      };
    }

    const totalsByDay = new Map();

    filteredTransactions.forEach((transaction) => {
      const isoDate = toISODate(transaction.date);
      totalsByDay.set(isoDate, roundCurrency((totalsByDay.get(isoDate) || 0) + transaction.amount));
    });

    const lastActualDate = filteredTransactions[filteredTransactions.length - 1].date;
    const horizonMonths = HORIZON_TO_MONTHS[horizon] || HORIZON_TO_MONTHS["3M"];
    const forecastEndDate = addMonths(lastActualDate, horizonMonths);
    const chartData = [];

    let rollingActual = 0;
    let cursor = new Date(periodStart);

    while (cursor <= lastActualDate) {
      const isoDate = toISODate(cursor);
      rollingActual = roundCurrency(rollingActual + (totalsByDay.get(isoDate) || 0));

      chartData.push({
        actualSpent: rollingActual,
        deltaFromCurrent: 0,
        displayDate: formatAxisDate(cursor),
        isoDate,
        projectedSpent: null,
      });

      cursor = addDays(cursor, 1);
    }

    const currentValue = rollingActual;
    const observedDays = Math.max(1, differenceInDays(periodStart, lastActualDate) + 1);
    const averageDailyChange = roundCurrency(currentValue / observedDays);

    chartData[chartData.length - 1] = {
      ...chartData[chartData.length - 1],
      deltaFromCurrent: 0,
      projectedSpent: currentValue,
    };

    let rollingProjection = currentValue;
    cursor = addDays(lastActualDate, 1);

    while (cursor && cursor <= forecastEndDate) {
      rollingProjection = roundCurrency(rollingProjection + averageDailyChange);

      chartData.push({
        actualSpent: null,
        deltaFromCurrent: roundCurrency(rollingProjection - currentValue),
        displayDate: formatAxisDate(cursor),
        isoDate: toISODate(cursor),
        projectedSpent: rollingProjection,
      });

      cursor = addDays(cursor, 1);
    }

    const budgetReference = Number.isFinite(Number(budgetLimit)) ? Number(budgetLimit) : null;
    const numericValues = chartData.flatMap((point) => [point.actualSpent, point.projectedSpent])
      .filter((value) => Number.isFinite(value));

    if (budgetReference !== null) {
      numericValues.push(budgetReference);
    }

    const minValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
    const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : 100;
    const padding = Math.max(50, Math.round((maxValue - minValue) * 0.12));

    return {
      averageDailyChange,
      budgetReference,
      currentValue,
      data: chartData,
      domain: [minValue - padding, maxValue + padding],
      emptyMessage: "",
      isEmpty: false,
      lastActualDate: toISODate(lastActualDate),
      projectedDelta: roundCurrency(rollingProjection - currentValue),
    };
  }, [budgetLimit, horizon, selectedPeriod, transactions]);
}
