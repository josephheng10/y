import type { ReactNode } from "react";

const paths = {
  wall: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 21v-7h6v7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  posts: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l1.5-4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 11.5h7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  sparkles: <><path d="M10 3c.8 4.5 2.5 6.2 7 7-4.5.8-6.2 2.5-7 7-.8-4.5-2.5-6.2-7-7 4.5-.8 6.2-2.5 7-7Z" /><path d="M18 13c.5 2.6 1.4 3.5 4 4-2.6.5-3.5 1.4-4 4-.5-2.6-1.4-3.5-4-4 2.6-.5 3.5-1.4 4-4Z" /></>,
  bookmark: <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-6-4-6 4z" />,
  moon: <path d="M21 13.2A9 9 0 1 1 10.8 3 7 7 0 0 0 21 13.2Z" />,
  sliders: <><path d="M4 7h2.5m5 0H20M4 17h8.5m5 0H20" /><circle cx="9" cy="7" r="2.5" /><circle cx="15" cy="17" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  send: <><path d="m21 3-7 18-3-8-8-3 18-7ZM11 13 21 3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  back: <path d="M19 12H5m6-6-6 6 6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  external: <path d="M13 5h6v6m0-6-9 9m7-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  campus: <><path d="m3 9 9-5 9 5H3Zm2 11h14M6 13v4m6-4v4m6-4v4" /></>,
  refresh: <><path d="M20 8a8 8 0 0 0-14-2L3 9m0-5v5h5m-4 7a8 8 0 0 0 14 2l3-3m0 5v-5h-5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" /></>,
  up: <path d="M12 19V5m-6 6 6-6 6 6" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
