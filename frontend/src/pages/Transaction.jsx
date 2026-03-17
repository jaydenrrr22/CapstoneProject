import React, { useState } from "react";
import "./Transaction.css";

const TransactionPage = () => {
  const [filter, setFilter] = useState("All");

  const mockTransactions = [
    { id: 1, type: "Income", source: "Salary", cost: "+$2000", date: "2026-03-01" },
    { id: 2, type: "Expense", source: "Groceries", cost: "-$150", date: "2026-03-05" },
    { id: 3, type: "Expense", source: "Gas", cost: "-$60", date: "2026-03-10" },
  ];

  const filteredTransactions =
    filter === "All"
      ? mockTransactions
      : mockTransactions.filter((t) => t.type === filter);

  return (
    <div className="dashboard-container">
      <div className="dashboard-inner">

        {/* Header */}
        <div className="dashboard-header">
          <h1>Transactions</h1>
        </div>

        {/* Transactions Card */}
        <div className="transactions-section">

          {/* Filter */}
          <div className="filter-row">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          {/* Table Header */}
          <div className="transaction-table-header">
            <span>Type</span>
            <span>Source</span>
            <span>Cost</span>
            <span>Date</span>
          </div>

          {/* Transactions */}
          {filteredTransactions.map((t) => (
            <div key={t.id} className="transaction-row">
              <span>{t.type}</span>
              <span>{t.source}</span>
              <span className={t.type === "Expense" ? "expense" : "income"}>
                {t.cost}
              </span>
              <span>{t.date}</span>
            </div>
          ))}
        </div>

        {/* Add Transaction Button */}
        <button className="add-transaction-btn">+ Add Transaction</button>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
        </div>

      </div>
    </div>
  );
};

export default TransactionPage;