import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Subscriptions from "./pages/Subscriptions";
import Budgets from "./pages/Budgets";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

function App() {

  return (
    <BrowserRouter>

      <AuthProvider>

      <Routes>

        {/* Default route */}
        <Route
          path="/"
          element={(
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          )}
        />

        <Route
          path="/login"
          element={(
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/signup"
          element={(
            <PublicOnlyRoute>
              <CreateAccount />
            </PublicOnlyRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/transactions"
          element={(
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/subscriptions"
          element={(
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/budgets"
          element={(
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          )}
        />
        <Route
          path="*"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />

      </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;