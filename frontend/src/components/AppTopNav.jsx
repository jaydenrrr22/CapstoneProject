import { NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDemoMode from "../hooks/useDemoMode";
import traceHeaderLogo from "../assets/trace_icon_1.png";
import { PRIMARY_NAV_ITEMS, getPageTitle, isSectionPathActive } from "../constants/routes";
import "./AppTopNav.css";

function AppTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { exitDemo, isDemoMode } = useDemoMode();

  const title = getPageTitle(location.pathname);
  const showAppNavigation = isAuthenticated || isDemoMode;

  return (
    <header className="app-top-nav" role="banner">
      <div className="app-top-nav-inner">
        <div className="app-top-nav-branding">
          <img src={traceHeaderLogo} alt="Trace" className="app-top-nav-logo" />
          <div>
            <p className="app-top-nav-eyebrow">Financial Workspace</p>
            <h1 className="app-top-nav-title">{title}</h1>
            {isDemoMode ? (
              <p className="app-top-nav-mode-pill">Demo Mode</p>
            ) : null}
          </div>
        </div>

        <nav className="app-top-nav-links" aria-label="Primary">
          {showAppNavigation ? (
            <>
              {PRIMARY_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={isSectionPathActive(location.pathname, item.matchPrefix) ? "active" : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup">Create Account</NavLink>
            </>
          )}
        </nav>

        {showAppNavigation ? (
          <div className="app-top-nav-actions">
            {isDemoMode ? (
              <button
                type="button"
                className="app-top-nav-exit-demo"
                onClick={() => {
                  exitDemo();
                  navigate("/login", { replace: true });
                }}
              >
                Exit Demo
              </button>
            ) : null}
            {isAuthenticated ? (
              <button className="app-top-nav-logout" onClick={() => logout()}>
                Logout
              </button>
            ) : null}
          </div>
        ) : (
          <div className="app-top-nav-spacer" />
        )}
      </div>
    </header>
  );
}

export default AppTopNav;
