const collegeStudentDataset = {
  id: "college-student",
  label: "College Student",
  shortDescription: "Part-time income, food delivery, and tight monthly cash flow.",
  budget: [
    { id: "budget-cs-1", period: "2026-04", amount: 950 },
    { id: "budget-cs-2", period: "2026-03", amount: 900 },
  ],
  transactions: [
    { id: "cs-tx-1", store_name: "Campus Bookstore", category: "Education", cost: 142.35, date: "2026-04-02" },
    { id: "cs-tx-2", store_name: "Trader Joe's", category: "Groceries", cost: 68.20, date: "2026-04-03" },
    { id: "cs-tx-3", store_name: "Chipotle", category: "Dining", cost: 16.80, date: "2026-04-04" },
    { id: "cs-tx-4", store_name: "Spotify", category: "Subscriptions", cost: 10.99, date: "2026-04-05" },
    { id: "cs-tx-5", store_name: "Lyft", category: "Transport", cost: 27.40, date: "2026-04-06" },
    { id: "cs-tx-6", store_name: "Target", category: "Essentials", cost: 48.15, date: "2026-04-07" },
    { id: "cs-tx-7", store_name: "DoorDash", category: "Dining", cost: 29.55, date: "2026-04-08" },
    { id: "cs-tx-8", store_name: "Campus Cafe", category: "Dining", cost: 12.40, date: "2026-04-09" },
  ],
  subscriptions: [
    { merchant: "Spotify", amount: 10.99, frequency: "Monthly", is_duplicate: false },
    { merchant: "iCloud", amount: 2.99, frequency: "Monthly", is_duplicate: false },
  ],
  predictions: [
    { id: "cs-p-1", name: "Weekend food delivery", amount: 34.5 },
    { id: "cs-p-2", name: "Transit refill", amount: 20 },
  ],
  anomalies: [
    {
      merchant: "Campus Bookstore",
      category: "Education",
      actual_amount: 142.35,
      expected_amount: 58.0,
      anomaly_type: "Spike",
      date: "2026-04-02",
    },
  ],
};

const youngProfessionalDataset = {
  id: "young-professional",
  label: "Young Professional",
  shortDescription: "Stable salary, active subscriptions, and rising lifestyle spend.",
  budget: [
    { id: "budget-yp-1", period: "2026-04", amount: 2500 },
    { id: "budget-yp-2", period: "2026-03", amount: 2400 },
  ],
  transactions: [
    { id: "yp-tx-1", store_name: "Whole Foods", category: "Groceries", cost: 124.55, date: "2026-04-01" },
    { id: "yp-tx-2", store_name: "Equinox", category: "Health", cost: 168.0, date: "2026-04-02" },
    { id: "yp-tx-3", store_name: "Uber", category: "Transport", cost: 42.10, date: "2026-04-03" },
    { id: "yp-tx-4", store_name: "Netflix", category: "Subscriptions", cost: 19.99, date: "2026-04-04" },
    { id: "yp-tx-5", store_name: "Amazon", category: "Shopping", cost: 89.35, date: "2026-04-05" },
    { id: "yp-tx-6", store_name: "Sweetgreen", category: "Dining", cost: 18.65, date: "2026-04-06" },
    { id: "yp-tx-7", store_name: "Con Edison", category: "Utilities", cost: 96.2, date: "2026-04-07" },
    { id: "yp-tx-8", store_name: "Airbnb", category: "Travel", cost: 240.0, date: "2026-04-08" },
  ],
  subscriptions: [
    { merchant: "Netflix", amount: 19.99, frequency: "Monthly", is_duplicate: false },
    { merchant: "ClassPass", amount: 79.0, frequency: "Monthly", is_duplicate: false },
    { merchant: "Adobe Creative Cloud", amount: 59.99, frequency: "Monthly", is_duplicate: false },
  ],
  predictions: [
    { id: "yp-p-1", name: "Rent autopay", amount: 1450 },
    { id: "yp-p-2", name: "Utilities catch-up", amount: 120 },
    { id: "yp-p-3", name: "Commute spend", amount: 55 },
  ],
  anomalies: [
    {
      merchant: "Airbnb",
      category: "Travel",
      actual_amount: 240.0,
      expected_amount: 72.0,
      anomaly_type: "Spike",
      date: "2026-04-08",
    },
  ],
};

const overspendingScenarioDataset = {
  id: "overspending-scenario",
  label: "Overspending Scenario",
  shortDescription: "Stacked subscriptions, impulse purchases, and budget pressure.",
  budget: [
    { id: "budget-os-1", period: "2026-04", amount: 1800 },
    { id: "budget-os-2", period: "2026-03", amount: 1750 },
  ],
  transactions: [
    { id: "os-tx-1", store_name: "Apple", category: "Shopping", cost: 399.0, date: "2026-04-01" },
    { id: "os-tx-2", store_name: "DoorDash", category: "Dining", cost: 42.75, date: "2026-04-02" },
    { id: "os-tx-3", store_name: "DoorDash", category: "Dining", cost: 37.10, date: "2026-04-03" },
    { id: "os-tx-4", store_name: "Hulu", category: "Subscriptions", cost: 18.99, date: "2026-04-04" },
    { id: "os-tx-5", store_name: "Hulu", category: "Subscriptions", cost: 18.99, date: "2026-04-04" },
    { id: "os-tx-6", store_name: "Best Buy", category: "Electronics", cost: 226.45, date: "2026-04-05" },
    { id: "os-tx-7", store_name: "Uber Eats", category: "Dining", cost: 34.8, date: "2026-04-06" },
    { id: "os-tx-8", store_name: "Sephora", category: "Shopping", cost: 112.6, date: "2026-04-07" },
    { id: "os-tx-9", store_name: "Nike", category: "Shopping", cost: 146.25, date: "2026-04-08" },
  ],
  subscriptions: [
    { merchant: "Hulu", amount: 18.99, frequency: "Monthly", is_duplicate: true },
    { merchant: "Hulu", amount: 18.99, frequency: "Marked", is_duplicate: true },
    { merchant: "Peloton", amount: 44.0, frequency: "Monthly", is_duplicate: false },
    { merchant: "YouTube Premium", amount: 13.99, frequency: "Monthly", is_duplicate: false },
  ],
  predictions: [
    { id: "os-p-1", name: "Impulse shopping trend", amount: 180 },
    { id: "os-p-2", name: "Recurring delivery spend", amount: 95 },
    { id: "os-p-3", name: "Streaming renewals", amount: 51 },
  ],
  anomalies: [
    {
      merchant: "Apple",
      category: "Shopping",
      actual_amount: 399.0,
      expected_amount: 95.0,
      anomaly_type: "Spike",
      date: "2026-04-01",
    },
    {
      merchant: "Best Buy",
      category: "Electronics",
      actual_amount: 226.45,
      expected_amount: 68.0,
      anomaly_type: "Spike",
      date: "2026-04-05",
    },
  ],
};

export const DEMO_DATASETS = [
  collegeStudentDataset,
  youngProfessionalDataset,
  overspendingScenarioDataset,
];

export function getDemoDatasetById(datasetId) {
  return DEMO_DATASETS.find((dataset) => dataset.id === datasetId) || DEMO_DATASETS[0];
}
