// Salman Sadiq logo mark, recoloured to the site palette. Uses theme vars so it follows light/dark.
export default function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-70 -70 140 140" aria-hidden="true" focusable="false">
      <rect x="-65" y="-65" width="60" height="60" rx="10" fill="var(--accent)" />
      <rect x="5" y="-65" width="60" height="60" rx="10" fill="var(--lime)" opacity="0.9" />
      <rect x="-65" y="5" width="60" height="60" rx="10" fill="var(--lime)" opacity="0.4" />
      <rect x="5" y="5" width="60" height="60" rx="10" fill="var(--paper)" opacity="0.95" />
      <circle cx="5" cy="-5" r="32" fill="none" stroke="var(--paper)" strokeWidth="3" strokeDasharray="6 4" />
      <line x1="-35" y1="-5" x2="45" y2="-5" stroke="var(--paper)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="5" y1="-45" x2="5" y2="35" stroke="var(--paper)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="5" cy="-5" r="4" fill="var(--accent)" />
      <path d="M-25,-35 Q5,-35 5,-5 Q5,25 35,25" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
