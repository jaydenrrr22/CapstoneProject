import "./StaticPages.css";

const COLOR_THEMES = {
  purple: {
    background: "#EEEDFE",
    text: "#3C3489",
  },
  teal: {
    background: "#E1F5EE",
    text: "#085041",
  },
  amber: {
    background: "#FAEEDA",
    text: "#633806",
  },
  coral: {
    background: "#FAECE7",
    text: "#712B13",
  },
  blue: {
    background: "#E6F1FB",
    text: "#0C447C",
  },
};

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.38a1.56 1.56 0 0 1 0 3.12ZM5.6 9.67h2.67V18H5.6V9.67Zm4.35 0h2.56v1.14h.04c.36-.68 1.23-1.4 2.54-1.4 2.72 0 3.22 1.8 3.22 4.12V18h-2.67v-3.96c0-.95-.02-2.16-1.31-2.16-1.32 0-1.52 1.03-1.52 2.09V18H9.95V9.67Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.22.7-3.9-1.55-3.9-1.55-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.72-1.55-2.57-.29-5.27-1.28-5.27-5.73 0-1.27.46-2.3 1.2-3.11-.12-.29-.52-1.47.11-3.06 0 0 .98-.31 3.2 1.19a11.17 11.17 0 0 1 5.83 0c2.22-1.5 3.2-1.19 3.2-1.19.63 1.59.23 2.77.11 3.06.74.81 1.2 1.84 1.2 3.11 0 4.46-2.7 5.44-5.29 5.72.41.36.78 1.08.78 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function TeamCard({ initials, name, role, color, bio, stack, linkedin, github }) {
  const theme = COLOR_THEMES[color] || COLOR_THEMES.purple;

  return (
    <article
      className="team-card"
      style={{
        "--team-accent": theme.text,
        "--team-accent-soft": theme.background,
      }}
    >
      <div className="team-card__top">
        <span className="team-card__avatar" aria-hidden="true">
          {initials}
        </span>

        <div className="team-card__identity">
          <h2>{name}</h2>
          <span className="team-card__role-badge">{role}</span>
        </div>
      </div>

      <p className="team-card__bio">{bio}</p>

      <footer className="team-card__footer">
        <span className="team-card__stack">{stack}</span>

        <div className="team-card__socials" aria-label={`${name} social links`}>
          <a
            href={linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on LinkedIn`}
          >
            <LinkedInIcon />
          </a>
          <a
            href={github}
            target="_blank"
            rel="noreferrer"
            aria-label={`${name} on GitHub`}
          >
            <GitHubIcon />
          </a>
        </div>
      </footer>
    </article>
  );
}

export default TeamCard;
