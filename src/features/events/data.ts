import type { CampusEvent } from "./types";

// Sample listings that lock the events shape. Replace the array with a real
// source later; keep listEvents and getEvent as the public functions.
const events: CampusEvent[] = [
  {
    id: "silliman-tea",
    title: "Silliman college tea",
    summary: "Weekly tea in the common room. Open to the residential college.",
    startsAt: "2026-11-19T16:00:00-05:00",
    endsAt: "2026-11-19T17:30:00-05:00",
    location: "Silliman College common room",
    host: "Silliman College",
  },
  {
    id: "yso-woolsey",
    title: "Yale Symphony Orchestra",
    summary: "Fall concert. Doors open 30 minutes before the downbeat.",
    startsAt: "2026-11-21T19:30:00-05:00",
    endsAt: "2026-11-21T21:30:00-05:00",
    location: "Woolsey Hall",
    host: "Yale Symphony Orchestra",
  },
  {
    id: "club-fair",
    title: "Winter club fair",
    summary: "Student organizations tabling for new members.",
    startsAt: "2026-12-02T12:00:00-05:00",
    endsAt: "2026-12-02T15:00:00-05:00",
    location: "Payne Whitney Gymnasium",
    host: "Yale College Council",
  },
];

export function listEvents(): CampusEvent[] {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getEvent(id: string): CampusEvent | undefined {
  return events.find((event) => event.id === id);
}
