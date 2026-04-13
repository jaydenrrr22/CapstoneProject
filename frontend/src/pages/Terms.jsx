import AppBreadcrumbs from "../components/AppBreadcrumbs";
import "./StaticPages.css";

function Terms() {
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
          <h1>Terms of Service</h1>
          <p className="static-page-summary">
            These Terms govern your access to and use of Trace, a financial analytics and budgeting web app
            designed to help users understand spending activity and plan with more clarity.
          </p>
          <p className="legal-updated">Last updated: April 9, 2026</p>
        </header>

        <section>
          <h2>Use of the Platform</h2>
          <p>
            You may use Trace only for lawful personal, educational, or internal business budgeting and
            analytics purposes. You agree not to misuse the platform, interfere with service operation,
            attempt unauthorized access, reverse engineer protected portions of the service, upload malicious
            code, or use Trace to violate the rights of others.
          </p>
        </section>

        <section>
          <h2>Account Responsibilities</h2>
          <p>
            You are responsible for the accuracy of information you provide, the activity that occurs under
            your account, and maintaining the confidentiality of your login credentials. Notify us promptly
            if you suspect unauthorized access or security issues affecting your account.
          </p>
        </section>

        <section>
          <h2>No Financial Advice</h2>
          <p>
            Trace provides budgeting tools, analytics, forecasts, subscription insights, and related
            informational outputs. Trace does not provide investment, tax, legal, accounting, or professional
            financial advice. You remain responsible for evaluating decisions and consulting qualified
            professionals before relying on any information for significant financial choices.
          </p>
        </section>

        <section>
          <h2>Service Availability and Changes</h2>
          <p>
            We may update, improve, suspend, or discontinue features as the product evolves. We aim to provide
            a reliable service, but we do not guarantee uninterrupted access, error-free operation, or that
            every prediction or analytics output will be complete, current, or accurate.
          </p>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            Trace, including its design, software, workflows, product names, visual elements, and generated
            interface content, is owned by Trace or its licensors and is protected by intellectual property
            laws. You retain ownership of financial records and content you submit, while granting Trace the
            rights needed to process that information to operate and improve the service.
          </p>
        </section>

        <section>
          <h2>Termination</h2>
          <p>
            We may suspend or terminate access if you violate these Terms, create security or legal risk,
            misuse the platform, or if continued access would harm Trace, other users, or service providers.
            You may stop using Trace at any time and request account deletion as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Trace and its team will not be liable for indirect,
            incidental, consequential, special, exemplary, or punitive damages, or for lost profits, lost data,
            or financial losses arising from use of or inability to use the service. Trace is provided on an
            as-available basis for informational budgeting and analytics support.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these Terms may be directed to a Trace team member through LinkedIn. Contact
            information is available on the Meet the Team page. We may update these Terms from time to time
            and will revise the last updated date when changes are made.
          </p>
        </section>
      </article>
    </main>
  );
}

export default Terms;
