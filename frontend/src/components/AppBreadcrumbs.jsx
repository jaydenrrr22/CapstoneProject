import { Link, useLocation } from "react-router-dom";
import { getBreadcrumbs } from "../constants/routes";
import "./AppBreadcrumbs.css";

function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="app-breadcrumbs" aria-label="Breadcrumb">
      <ol className="app-breadcrumbs__list">
        {breadcrumbs.map((crumb, index) => {
          const isCurrentPage = index === breadcrumbs.length - 1;

          return (
            <li key={`${crumb.label}-${crumb.to || index}`} className="app-breadcrumbs__item">
              {crumb.to && !isCurrentPage ? (
                <Link className="app-breadcrumbs__link" to={crumb.to}>
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="app-breadcrumbs__current"
                  {...(isCurrentPage ? { "aria-current": "page" } : {})}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default AppBreadcrumbs;

