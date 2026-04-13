import AppBreadcrumbs from "../components/AppBreadcrumbs";
import "./StaticPages.css";

function Privacy() {
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
          <h1>Privacy Policy</h1>
          <p className="static-page-summary">
            This Privacy Policy explains how Trace collects, uses, stores, and protects information
            when you use our financial analytics and budgeting web application.
          </p>
          <p className="legal-updated">Last updated: April 9, 2026</p>
        </header>

        <section>
          <h2>Information We Collect</h2>
          <p>
            Trace may collect account information such as your name, email address, authentication details,
            and account preferences. When you use budgeting and analytics features, we may process financial
            records you enter or connect to the service, including transactions, categories, merchants,
            amounts, dates, budgets, recurring expenses, and prediction inputs.
          </p>
          <p>
            We also collect usage and device information, such as pages viewed, feature interactions,
            approximate device type, browser information, IP address, error logs, and session activity.
            This helps us operate the service, identify reliability issues, and improve product quality.
          </p>
        </section>

        <section>
          <h2>How We Use Information</h2>
          <p>
            We use your information to provide core Trace functionality, including transaction organization,
            budget tracking, spending insights, subscription analysis, and predictive analytics. We may also
            use information to personalize your experience, improve models and product workflows, prevent
            misuse, debug errors, and communicate important service updates.
          </p>
          <p>
            Trace does not present predictions or insights as professional financial advice. Analytics are
            generated to help you understand patterns and make more informed personal decisions.
          </p>
        </section>

        <section>
          <h2>Storage and Security</h2>
          <p>
            We use administrative, technical, and organizational safeguards designed to protect user data
            against unauthorized access, loss, misuse, or alteration. These practices may include access
            controls, encrypted transport, credential protection, monitoring, and limiting access to personnel
            or service providers with a business need.
          </p>
          <p>
            No internet-based service can guarantee absolute security. You are responsible for using a strong
            password, keeping credentials confidential, and notifying us if you believe your account has been
            compromised.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>
            We may use third-party service providers to host infrastructure, store application data, provide
            authentication support, monitor errors, analyze product usage, or support financial data features
            where enabled. These providers are authorized to process information only as needed to deliver
            services to Trace and are expected to protect information under appropriate confidentiality and
            security obligations.
          </p>
        </section>

        <section>
          <h2>Your Choices and Rights</h2>
          <p>
            You may request access to your account information, correction of inaccurate information, deletion
            of your account, or a copy of certain data associated with your account. Some information may be
            retained where required for security, legal compliance, dispute resolution, or backup integrity.
          </p>
          <p>
            You can also control certain browser-level data collection through cookie settings and privacy
            controls, although disabling required cookies may affect sign-in or core application functionality.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this Privacy Policy or privacy requests may be directed to a Trace team member
            through LinkedIn. Contact information is available on the Meet the Team page.
          </p>
        </section>
      </article>
    </main>
  );
}

export default Privacy;
