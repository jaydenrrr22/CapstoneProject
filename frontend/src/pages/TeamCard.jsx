import githubIcon from "../assets/github.png";
import linkedinIcon from "../assets/linkedin.png";
import "./StaticPages.css";

const roleIcons = {
  frontend: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 5-4 14" />
    </svg>
  ),
  backend: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="5" rx="1.5" />
      <rect x="4" y="14" width="16" height="5" rx="1.5" />
      <path d="M8 7.5h.01" />
      <path d="M8 16.5h.01" />
      <path d="M12 7.5h4" />
      <path d="M12 16.5h4" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  ),
  fullstack: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <path d="M7 4v16" />
      <path d="M17 4v16" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 2.9 8.7 7 10 4.1-1.3 7-5.5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.6-3.9" />
    </svg>
  ),
};

function TeamCard({ role, name, description, icon, accent, accentSoft, linkedinUrl, githubUrl }) {
  return (
    <article
      className="team-card"
      style={{ "--team-accent": accent, "--team-accent-soft": accentSoft }}
    >
      <div className="team-card-header">
        <span className="team-card-icon">{roleIcons[icon]}</span>
        <p className="team-card-role">{role}</p>
      </div>
      <h2>{name}</h2>
      <p className="team-card-description">{description}</p>
      <div className="team-card-footer">
        <div className="team-card-socials" aria-label={`${name} social links`}>
          <a
            className="team-social-link team-social-linkedin"
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on LinkedIn`}
          >
            <img src={linkedinIcon} alt="" aria-hidden="true" />
          </a>
          <a
            className="team-social-link team-social-github"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on GitHub`}
          >
            <img src={githubIcon} alt="" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default TeamCard;
