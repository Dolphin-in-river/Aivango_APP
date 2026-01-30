import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const TrophyIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M8 21h8" />
    <path d="M12 17c-2.8 0-5-2.2-5-5V4h10v8c0 2.8-2.2 5-5 5Z" />
    <path d="M7 6H4c0 3 2 5 4 5" />
    <path d="M17 6h3c0 3-2 5-4 5" />
  </svg>
);

export const MapPinIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const CalendarIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M8 3v3" />
    <path d="M16 3v3" />
    <path d="M4 7h16" />
    <path d="M5 7v14h14V7" />
  </svg>
);

export const UsersIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a3 3 0 0 1 0 5.74" />
  </svg>
);

export const CoinsIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <ellipse cx="12" cy="5" rx="7" ry="3" />
    <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
    <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
  </svg>
);

export const SwordsIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M14.5 4.5 19.5 9.5" />
    <path d="M4.5 14.5 9.5 19.5" />
    <path d="M9.5 4.5 4.5 9.5" />
    <path d="M19.5 14.5 14.5 19.5" />
    <path d="M8 8 16 16" />
    <path d="M16 8 8 16" />
  </svg>
);

export const TicketIcon = (props: Props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M4 9a2 2 0 0 0 0 6v4h16v-4a2 2 0 0 0 0-6V5H4v4Z" />
    <path d="M9 8v8" />
  </svg>
);
