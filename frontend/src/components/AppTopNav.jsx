import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import traceHeaderLogo from "../assets/trace_icon.png";
import "./AppTopNav.css";

const TITLE_BY_PATH = {
  "/dashboard": "Dashboard",
  "/intelligence": "Intelligence Overview",
  "/transactions": "Transactions",
  "/transaction": "Transactions",
  "/subscriptions": "Subscriptions",
  "/budgets": "Budgets",
  "/team": "Meet the Team",
  "/legal/privacy": "Privacy Policy",
  "/legal/terms": "Terms of Service",
  "/legal/cookies": "Cookie Policy",
  "/login": "Login",
  "/signup": "Create Account",
};

function AppTopNav() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const title = TITLE_BY_PATH[location.pathname] || "Trace";

  return (
    <header className="app-top-nav" role="banner">
      <div className="app-top-nav-inner">
        <div className="app-top-nav-branding">
          <img src={traceHeaderLogo} alt="Trace" className="app-top-nav-logo" />
          <div>
            <p className="app-top-nav-eyebrow">Financial Workspace</p>
            <h1 className="app-top-nav-title">{title}</h1>
          </div>
        </div>

        <nav className="app-top-nav-links" aria-label="Primary">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">Home</NavLink>
              <NavLink to="/intelligence">Intelligence</NavLink>
              <NavLink to="/transactions">Transactions</NavLink>
              <NavLink to="/subscriptions">Subscriptions</NavLink>
              <NavLink to="/budgets">Budgets</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup">Create Account</NavLink>
            </>
          )}
        </nav>

        {isAuthenticated ? (
          <button className="app-top-nav-logout" onClick={() => logout()}>
            Logout
          </button>
        ) : (
          <div className="app-top-nav-spacer" />
        )}
      </div>
    </header>
  );
}

export default AppTopNav;
