import { Link } from "react-router-dom";
import "./StaticPages.css";

function LegalPlaceholder({ title, summary }) {
  return (
    <main className="static-page-shell">
      <section className="static-page-card">
        <p className="static-page-eyebrow">Legal</p>
        <h1>{title}</h1>
        <p className="static-page-summary">{summary}</p>
        <p className="static-page-note">
          This section presents a concise legal overview for the demo environment.
          Final legal language can be expanded for production release.
        </p>
        <Link className="static-page-link" to="/dashboard">
          Return to Dashboard
        </Link>
      </section>
    </main>
  );
}

export default LegalPlaceholder;
