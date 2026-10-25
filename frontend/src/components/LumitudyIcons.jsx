function Icon({ children }) {
  return <svg className="decorative-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true" focusable="false">{children}</svg>
}

export function StarIcon() {
  return <Icon><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Icon>
}

export function SparkIcon() {
  return <Icon><path d="M12 1C10 8 8 10 1 12c7 2 9 4 11 11 2-7 4-9 11-11C16 10 14 8 12 1Z" fill="currentColor" /></Icon>
}

export function SunIcon() {
  return <Icon><g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></g></Icon>
}

export function MoonIcon() {
  return <Icon><path d="M20.5 14.5A9 9 0 0 1 9.5 3.5a9 9 0 1 0 11 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></Icon>
}
