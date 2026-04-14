import AppBreadcrumbs from "../components/AppBreadcrumbs";
import "./StaticPages.css";

function Cookies() {
  return (
    <main className="static-page-shell legal-page-shell">
      <section className="static-page-container">
        <AppBreadcrumbs />
      </section>

      <article className="static-page-container legal-document">
        <aside className="legal-academic-note">
          Trace is a capstone project for ITSC-4155. This legal information is included for demo and
          presentation purposes only and should not be relied on as real legal guidance.
        </aside>

        <header className="legal-document-header">
          <p className="static-page-eyebrow">Legal</p>
          <h1>Cookie Policy</h1>
          <p className="static-page-summary">
            This Cookie Policy explains how Trace may use cookies and similar browser technologies to keep
            the application secure, reliable, and easy to use.
          </p>
          <p className="legal-updated">Last updated: April 9, 2026</p>
        </header>

        <section>
          <h2>What Cookies Are</h2>
          <p>
            Cookies are small text files stored by your browser when you visit a website. Similar technologies,
            such as local storage or session storage, can help remember application state, security preferences,
            or product settings between page loads.
          </p>
        </section>

        <section>
          <h2>Cookies We May Use</h2>
          <p>
            Trace may use required session cookies to keep you signed in, maintain secure application sessions,
            and protect against unauthorized activity. We may also use preference cookies or browser storage to
            remember settings such as demo mode, navigation state, or interface choices.
          </p>
          <p>
            Where analytics are enabled, Trace may use analytics cookies or similar identifiers to understand
            feature usage, diagnose performance issues, and improve the product experience. Analytics data is
            used to evaluate aggregate product behavior, not to sell user profiles.
          </p>
        </section>

        <section>
          <h2>Why Cookies Are Used</h2>
          <p>
            Cookies and related technologies help Trace provide authentication, session continuity, security
            protections, fraud prevention, product reliability, usage analytics, and a more consistent user
            experience across visits.
          </p>
        </section>

        <section>
          <h2>Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings, including blocking or deleting cookies.
            If you block required cookies, some Trace features may not function correctly, including sign-in,
            account security, and saved application state.
          </p>
          <p>
            Browser vendors provide their own controls for clearing cookies, blocking third-party cookies, and
            managing site-specific permissions. Your choices may need to be applied separately on each browser
            or device you use.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this Cookie Policy may be directed to a Trace team member through LinkedIn.
            Contact information is available on the Meet the Team page. We may update this policy as product
            functionality or browser technology changes.
          </p>
        </section>
      </article>
    </main>
  );
}

export default Cookies;

