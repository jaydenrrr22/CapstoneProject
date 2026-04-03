import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import Dashboard from "./pages/Dashboard";
import IntelligenceDashboard from "./pages/IntelligenceDashboard";
import ModeSelection from "./pages/ModeSelection";
import Subscriptions from "./pages/Subscriptions";
import Budgets from "./pages/Budgets";
import Team from "./pages/Team";
import LegalPlaceholder from "./pages/LegalPlaceholder";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import TransactionPage from "./pages/Transaction";
import AppTopNav from "./components/AppTopNav";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalErrorBanner from "./components/GlobalErrorBanner";

function AppRoutes() {
  const location = useLocation();
  const hideChrome = ["/", "/login", "/signup", "/mode-select"].includes(location.pathname);

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <GlobalErrorBanner />
      {!hideChrome && <AppTopNav />}

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
          path="/mode-select"
          element={(
            <ProtectedRoute>
              <ModeSelection />
            </ProtectedRoute>
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
          path="/intelligence/*"
          element={(
            <ProtectedRoute>
              <IntelligenceDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/transactions"
          element={(
            <ProtectedRoute>
              <TransactionPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/transaction"
          element={(
            <ProtectedRoute>
              <Navigate to="/transactions" replace />
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
        <Route path="/team" element={<Team />} />
        <Route
          path="/legal/privacy"
          element={
            <LegalPlaceholder
              title="Privacy Policy"
              summary="How Trace collects, stores, and protects user financial data, with clear consent and retention rules."
            />
          }
        />
        <Route
          path="/legal/terms"
          element={
            <LegalPlaceholder
              title="Terms of Service"
              summary="The usage terms that define account responsibilities, acceptable use, and service limitations."
            />
          }
        />
        <Route
          path="/legal/cookies"
          element={
            <LegalPlaceholder
              title="Cookie Policy"
              summary="How cookies and similar technologies are used for authentication, session management, and product analytics."
            />
          }
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

      {!hideChrome && <Footer />}
    </ErrorBoundary>
  );
}

function App() {

  return (
    <BrowserRouter>

      <AuthProvider>

        <AppRoutes />

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;
