import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import AppTopNav from "./components/AppTopNav";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalErrorBanner from "./components/GlobalErrorBanner";
import DemoWalkthrough from "./components/demo/DemoWalkthrough";

const Login = lazy(() => import("./pages/Login"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const IntelligenceDashboard = lazy(() => import("./pages/IntelligenceDashboard"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const MeetTheTeam = lazy(() => import("./pages/MeetTheTeam"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const TransactionPage = lazy(() => import("./pages/Transaction"));

function RouteLoading() {
  return (
    <main className="route-loading-shell" aria-live="polite" aria-busy="true">
      <div className="route-loading-card">Loading Trace...</div>
    </main>
  );
}

function AppRoutes() {
  const location = useLocation();
  const hideChrome = ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <GlobalErrorBanner />
      {!hideChrome && <AppTopNav />}

      <Suspense fallback={<RouteLoading />}>
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
          <Route path="/team" element={<MeetTheTeam />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/cookies" element={<Cookies />} />
          <Route
            path="*"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />

        </Routes>
      </Suspense>

      <DemoWalkthrough />
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
