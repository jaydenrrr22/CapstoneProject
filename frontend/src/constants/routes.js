export const PRIMARY_NAV_ITEMS = [
  {
    key: "dashboard",
    to: "/dashboard",
    label: "Home",
    title: "Dashboard",
    matchPrefix: "/dashboard",
  },
  {
    key: "intelligence",
    to: "/intelligence",
    label: "Intelligence",
    title: "Intelligence Overview",
    matchPrefix: "/intelligence",
  },
  {
    key: "transactions",
    to: "/transactions",
    label: "Transactions",
    title: "Transactions",
    matchPrefix: "/transactions",
  },
  {
    key: "subscriptions",
    to: "/subscriptions",
    label: "Subscriptions",
    title: "Subscriptions",
    matchPrefix: "/subscriptions",
  },
  {
    key: "budgets",
    to: "/budgets",
    label: "Budgets",
    title: "Budgets",
    matchPrefix: "/budgets",
  },
];

export const STATIC_TITLES = {
  "/transaction": "Transactions",
  "/team": "Meet the Team",
  "/legal/privacy": "Privacy Policy",
  "/legal/terms": "Terms of Service",
  "/legal/cookies": "Cookie Policy",
  "/login": "Login",
  "/signup": "Create Account",
};

export function getPageTitle(pathname) {
  const primaryMatch = PRIMARY_NAV_ITEMS.find(({ matchPrefix }) =>
    pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`)
  );

  if (primaryMatch) {
    return primaryMatch.title;
  }

  return STATIC_TITLES[pathname] || "Trace";
}

export function isSectionPathActive(pathname, matchPrefix) {
  return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);
}

export function getBreadcrumbs(pathname) {
  if (isSectionPathActive(pathname, "/intelligence")) {
    const breadcrumbs = [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Intelligence", to: "/intelligence" },
    ];

    const intelligenceSubpath = pathname.replace(/^\/intelligence\/?/, "");

    if (intelligenceSubpath) {
      breadcrumbs.push({
        label: intelligenceSubpath
          .split("/")
          .map((segment) =>
            segment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          )
          .join(" / "),
      });
    }

    return breadcrumbs;
  }

  return [];
}
