function BaseIcon({ children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ForecastIcon() {
  return (
    <BaseIcon>
      <path d="M4 17.5L9 12.5L13 15.5L20 8.5" />
      <path d="M15 8.5H20V13.5" />
      <path d="M4 5.5V19.5H20" />
    </BaseIcon>
  );
}

export function PredictionIcon() {
  return (
    <BaseIcon>
      <path d="M12 3.5L19.5 7.75V16.25L12 20.5L4.5 16.25V7.75L12 3.5Z" />
      <path d="M12 7.5V12.25L15 14" />
    </BaseIcon>
  );
}

export function SubscriptionIcon() {
  return (
    <BaseIcon>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M3.5 9.5H20.5" />
      <path d="M8 14.5H10.5" />
      <path d="M13 14.5H16" />
    </BaseIcon>
  );
}

