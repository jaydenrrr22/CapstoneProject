import { useMemo, useState } from "react";
import AppBreadcrumbs from "../components/AppBreadcrumbs";
import TeamCard from "./TeamCard";
import "./StaticPages.css";

const teamMembers = [
  {
    initials: "NK",
    name: "Nick Knoblauch",
    role: "Frontend",
    color: "purple",
    bio: "Built the React frontend using Vite, covering core pages, dashboard flows, transaction views, and intelligence visualizations. Implemented charts, decision modals, and insight cards with full API integration through Axios.",
    stack: "React · Vite · Axios",
    tags: ["React + Vite"],
    linkedin: "https://linkedin.com/in/nicholas-knoblauch-5271261a2",
    github: "https://github.com/nknobla1",
  },
  {
    initials: "JR",
    name: "Jayden Ryu",
    role: "Backend",
    color: "teal",
    bio: "Developed the FastAPI backend powering Trace, including endpoints for users, transactions, budgets, and predictions. Integrated SQLAlchemy with MySQL, JWT authentication, and the core intelligence pipeline structure.",
    stack: "FastAPI · SQLAlchemy · JWT",
    tags: ["FastAPI"],
    linkedin: "https://linkedin.com/in/jayden-ryu",
    github: "https://github.com/jaydenrrr22",
  },
  {
    initials: "AG",
    name: "Alana Green",
    role: "Data Engineering",
    color: "amber",
    bio: "Designed the financial dataset system so users can choose prebuilt datasets and extend them with custom transactions. Structured the data models behind budgeting, categorization, and prediction inputs across Trace analytics.",
    stack: "MySQL · Data modeling",
    tags: ["Financial Data"],
    linkedin: "https://linkedin.com/in/alana-green-20b548296",
    github: "https://github.com/AlananaG",
  },
  {
    initials: "LG",
    name: "Luis Ruano Gomez",
    role: "Frontend + Backend",
    color: "coral",
    bio: "Integrated frontend components with backend services by connecting React UI to FastAPI endpoints for live updates. Synchronized state across transaction tracking, simulations, and intelligence analysis workflows.",
    stack: "React · FastAPI · State mgmt",
    tags: ["React + Vite", "FastAPI"],
    linkedin: "https://linkedin.com/in/lruanog",
    github: "https://github.com/LuisRuanoG",
  },
  {
    initials: "BT",
    name: "Benjamin Taylor",
    role: "DevOps + Security",
    color: "blue",
    bio: "Led deployment and security on AWS EC2 with Nginx reverse proxying, HTTPS enforcement, and systemd service management. Implemented JWT enforcement, rate limiting, security headers, CloudWatch logging, and Nuclei scanning.",
    stack: "AWS · Nginx · CloudWatch",
    tags: ["AWS + Security"],
    linkedin: "https://linkedin.com/in/btayl106",
    github: "https://github.com/benjqminn",
  },
];

const filterOptions = ["All", "React + Vite", "FastAPI", "Financial Data", "AWS + Security"];

function MeetTheTeam() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredMembers = useMemo(() => {
    if (activeFilter === "All") {
      return teamMembers;
    }

    return teamMembers.filter((member) => member.tags.includes(activeFilter));
  }, [activeFilter]);

  return (
    <main className="static-page-shell team-page-shell">
      <section className="static-page-container">
        <AppBreadcrumbs />
      </section>

      <section className="static-page-container static-page-intro team-page-intro">
        <p className="static-page-eyebrow">Team</p>
        <h1>Meet the Team</h1>
        <p className="static-page-summary">
          Trace is built by five people spanning product UI, backend architecture, data engineering, full-stack integration, and cloud security.
        </p>

        <div className="team-filter-pills" aria-label="Filter team members by discipline">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                className={`team-filter-pill${isActive ? " is-active" : ""}`}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={isActive}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      <section
        key={activeFilter}
        className="static-page-container team-grid team-grid--filtered"
        aria-label="Trace team members"
      >
        {filteredMembers.map((member) => (
          <TeamCard key={member.name} {...member} />
        ))}
      </section>
    </main>
  );
}

export default MeetTheTeam;

