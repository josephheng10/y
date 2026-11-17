import type { CampusInfo } from "./types";

// Sample guides that lock the info shape. Replace the array with a real
// source later; keep listInfo and getInfo as the public functions.
const guides: CampusInfo[] = [
  {
    slug: "dining-hours",
    title: "Where to check dining hours",
    summary: "Dining halls change hours around breaks and reading period.",
    body: "Use the Yale Hospitality site for the current week. Residential college dining halls and the commons kitchens publish separate schedules, and both shift on holidays.",
    category: "Dining",
  },
  {
    slug: "course-search",
    title: "How to read a course listing",
    summary: "Yale Course Search is the source for what is actually offered this term.",
    body: "Search by subject, then check the meeting time, instructor, and distributional designations on the section. A listing from last year is not a promise that the course runs again.",
    category: "Academics",
  },
  {
    slug: "reserve-a-room",
    title: "Reserving a room for a student group",
    summary: "Registered organizations book campus rooms through the room reservation system.",
    body: "Start with your organization's home space, then request a classroom or college room if you need a larger one. Book early for evenings, and include the expected headcount so the request is not bounced.",
    category: "Organizations",
  },
];

export function listInfo(): CampusInfo[] {
  return [...guides].sort((a, b) => a.title.localeCompare(b.title));
}

export function getInfo(slug: string): CampusInfo | undefined {
  return guides.find((guide) => guide.slug === slug);
}
