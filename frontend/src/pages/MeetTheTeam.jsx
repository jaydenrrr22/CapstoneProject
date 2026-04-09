import TeamCard from "./TeamCard";
import "./StaticPages.css";

const teamMembers = [
  {
    role: "Frontend",
    name: "Nick Knoblauch",
    description:
      "Built the React frontend using Vite, developing core pages including the dashboard, transaction views, and intelligence visualizations. Implemented dynamic components such as charts, decision modals, and insight cards, and ensured responsive design and smooth API integration with the backend through Axios.",
    icon: "frontend",
    accent: "#22223b",
    accentSoft: "rgba(34, 34, 59, 0.12)",
    linkedinUrl: "https://linkedin.com/in/nicholas-knoblauch-5271261a2",
    githubUrl: "https://github.com/nknobla1",
  },
  {
    role: "Backend",
    name: "Jayden Ryu",
    description:
      "Developed the FastAPI backend powering Trace, including RESTful endpoints for users, transactions, budgets, datasets, and predictions. Integrated SQLAlchemy with a MySQL database, implemented JWT-based authentication, and structured the API to support a unified intelligence pipeline for financial analysis.",
    icon: "backend",
    accent: "#4a4e69",
    accentSoft: "rgba(74, 78, 105, 0.14)",
    linkedinUrl: "https://linkedin.com/in/jayden-ryu",
    githubUrl: "https://github.com/jaydenrrr22",
  },
  {
    role: "Data Engineering",
    name: "Alana Green",
    description:
      "Designed and managed the financial dataset system, enabling users to select prebuilt datasets and extend them with custom transactions. Structured data models to support budgeting, transaction categorization, and prediction inputs, ensuring consistency across analytics and intelligence features.",
    icon: "data",
    accent: "#22223b",
    accentSoft: "rgba(34, 34, 59, 0.12)",
    linkedinUrl: "https://linkedin.com/in/alana-green-20b548296",
    githubUrl: "https://github.com/AlananaG",
  },
  {
    role: "Frontend + Backend",
    name: "Luis Ruano Gomez",
    description:
      "Integrated frontend components with backend services, connecting React UI elements to FastAPI endpoints for real-time data updates. Worked on synchronizing application state across features like transaction tracking, simulations, and intelligence analysis to ensure a cohesive user experience.",
    icon: "fullstack",
    accent: "#4a4e69",
    accentSoft: "rgba(74, 78, 105, 0.14)",
    linkedinUrl: "https://linkedin.com/in/lruanog",
    githubUrl: "https://github.com/LuisRuanoG",
  },
  {
    role: "DevOps & Security",
    name: "Benjamin Taylor",
    description:
      "Led deployment and security for Trace using AWS EC2 with an Ubuntu server, configuring Nginx as a reverse proxy with HTTPS enforcement and API routing. Implemented systemd service management for the FastAPI backend, structured JSON logging with separate application and security logs, and integrated monitoring with CloudWatch metrics. Added API rate limiting, JWT authentication enforcement, and security headers, and conducted vulnerability scanning using Nuclei to validate system security.",
    icon: "security",
    accent: "#22223b",
    accentSoft: "rgba(34, 34, 59, 0.12)",
    linkedinUrl: "https://linkedin.com/in/btayl106",
    githubUrl: "https://github.com/benjqminn",
  },
];

function MeetTheTeam() {
  return (
    <main className="static-page-shell team-page-shell">
      <section className="static-page-container static-page-intro">
        <p className="static-page-eyebrow">Team</p>
        <h1>Meet the Team</h1>
        <p className="static-page-summary">
          Trace comes together through a hands-on team spanning product UI, backend architecture,
          data systems, integrations, deployment, and security.
        </p>
        <div className="team-stack-list" aria-label="Trace technology areas">
          <span>React + Vite</span>
          <span>FastAPI</span>
          <span>Financial Data</span>
          <span>AWS + Security</span>
        </div>
      </section>

      <section className="static-page-container team-grid" aria-label="Trace team members">
        {teamMembers.map((member) => (
          <TeamCard key={member.name} {...member} />
        ))}
      </section>
    </main>
  );
}

export default MeetTheTeam;
