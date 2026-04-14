import { NavLink } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand-block">
          <p className="site-footer-brand">TRACE</p>
          <p className="site-footer-tagline">
            Smarter spending decisions with practical financial insights.
          </p>
        </div>

        <nav className="site-footer-links" aria-label="Footer links">
          <NavLink to="/team">Meet the Team</NavLink>
          <NavLink to="/legal/privacy">Privacy</NavLink>
          <NavLink to="/legal/terms">Terms</NavLink>
          <NavLink to="/legal/cookies">Cookies</NavLink>
        </nav>

        <p className="site-footer-copy">&copy; {year} Trace. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;

