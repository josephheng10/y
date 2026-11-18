import { followedBoost } from "./campus/catalog";
import type { Category, Item } from "./types";

/** What someone is actually trying to get out of a night at Yale. */
export interface Need {
  id: string;
  label: string;
  sub: string;
  interests: string[];
  bg: string;
  fg: string;
}

export interface Interest {
  id: string;
  label: string;
  keys: string[];
  /** Category match, used when the topic is broad (food, jobs, clubs). */
  categories: Category[];
}

export interface Profile {
  needs: string[];
  interests: string[];
  college: string | null;
  name: string;
  going: string[];
  saved: string[];
  hidden: string[];
  /** Catalog ids the digger should open. */
  follows: string[];
  tuned: boolean;
}

export const EMPTY_PROFILE: Profile = {
  needs: [],
  interests: [],
  college: null,
  name: "",
  going: [],
  saved: [],
  hidden: [],
  follows: [],
  tuned: false,
};

export const COLLEGES = [
  "Benjamin Franklin",
  "Berkeley",
  "Branford",
  "Davenport",
  "Ezra Stiles",
  "Grace Hopper",
  "Jonathan Edwards",
  "Morse",
  "Pauli Murray",
  "Pierson",
  "Saybrook",
  "Silliman",
  "Timothy Dwight",
  "Trumbull",
] as const;

export const NEEDS: Need[] = [
  { id: "eat", label: "Something to eat", sub: "Free food and butteries", interests: ["food"], bg: "#F2E43A", fg: "#161616" },
  { id: "out", label: "Somewhere to go", sub: "Parties, formals, dances", interests: ["party"], bg: "#111111", fg: "#F6F6F2" },
  { id: "people", label: "People", sub: "Clubs, jams, open rooms", interests: ["culture", "music"], bg: "#F3EFE4", fg: "#141414" },
  { id: "money", label: "A gig", sub: "Jobs, labs, pitch nights", interests: ["career", "research"], bg: "#0E1F18", fg: "#E7F6D8" },
  { id: "show", label: "A show", sub: "Music, improv, galleries", interests: ["music", "arts", "comedy"], bg: "#1C1A17", fg: "#FFB25A" },
  { id: "outside", label: "Outside", sub: "Trips, IM, climbing", interests: ["outdoors", "sports"], bg: "#0C2340", fg: "#F7F4EE" },
];

export const INTERESTS: Interest[] = [
  { id: "food", label: "Free food", keys: ["food", "pizza", "bagel", "cookie", "dumpling", "brunch", "boba", "pies", "buttery", "cheese", "tea and"], categories: ["Free food"] },
  { id: "party", label: "Going out", keys: ["party", "formal", "dance", "nightlife", "spring fling", "fling", "inferno", "buttery"], categories: [] },
  { id: "music", label: "Music", keys: ["cappella", "concert", "jam", "singing", "music", "rehearsal", "orchestra", "yso", "band"], categories: [] },
  { id: "career", label: "Gigs", keys: ["startup", "pitch", "position", "career", "recruit", "consult", "apply", "applications", "paid", "coffee chat"], categories: ["Opportunity"] },
  { id: "research", label: "Research", keys: ["lab", "research", "fellowship", "psychology", "ra "], categories: [] },
  { id: "arts", label: "Arts", keys: ["novel", "writing", "theater", "improv", "gallery", "paint", "film", "art"], categories: [] },
  { id: "comedy", label: "Shows", keys: ["improv", "comedy", "dramat", "show"], categories: [] },
  { id: "sports", label: "Sports", keys: ["basketball", "soccer", "intramural", "sport", "game", "tryout", "payne"], categories: [] },
  { id: "culture", label: "Clubs", keys: ["cultural", "aacc", "first-gen", "community", "club"], categories: ["Club news"] },
  { id: "outdoors", label: "Outside", keys: ["climb", "trip", "gunks", "hike", "outdoor"], categories: [] },
];

export const QUICKS: { id: string; label: string }[] = [
  { id: "foryou", label: "For you" },
  { id: "food", label: "Food" },
  { id: "party", label: "Going out" },
  { id: "career", label: "Gigs" },
  { id: "music", label: "Music" },
  { id: "arts", label: "Arts" },
  { id: "sports", label: "Sports" },
  { id: "culture", label: "Clubs" },
  { id: "noise", label: "Noise" },
];

const KEY = "y.profile.v1";

export function loadProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      ...EMPTY_PROFILE,
      ...parsed,
      needs: Array.isArray(parsed.needs) ? parsed.needs : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      going: Array.isArray(parsed.going) ? parsed.going : [],
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      follows: Array.isArray(parsed.follows) ? parsed.follows.filter((id) => typeof id === "string") : [],
      college: typeof parsed.college === "string" ? parsed.college : null,
      name: typeof parsed.name === "string" ? parsed.name : "",
      tuned: Boolean(parsed.tuned),
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveProfile(profile: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function blobOf(item: Item): string {
  return `${item.title} ${item.summary} ${item.location ?? ""} ${item.category}`.toLowerCase();
}

export function itemMatchesInterest(item: Item, interestId: string): boolean {
  const spec = INTERESTS.find((i) => i.id === interestId);
  if (!spec) return false;
  if (spec.categories.includes(item.category)) return true;
  const blob = blobOf(item);
  return spec.keys.some((k) => blob.includes(k));
}

export function itemMatchesQuick(item: Item, quick: string, interests: string[]): boolean {
  if (quick === "noise") return item.category === "Noise";
  if (item.category === "Noise") return false;
  if (quick === "all") return true;
  if (quick === "foryou") {
    if (interests.length === 0) return true;
    return interests.some((id) => itemMatchesInterest(item, id));
  }
  return itemMatchesInterest(item, quick);
}

/** Higher means it should lead the wall. College hits outrank a generic keyword hit. */
export function tuneScore(item: Item, profile: Profile, now = Date.now()): number {
  let score = item.score;
  for (const id of profile.interests) {
    if (itemMatchesInterest(item, id)) score += 34;
  }
  if (profile.college && blobOf(item).includes(profile.college.toLowerCase())) score += 48;
  score += followedBoost(item, profile.follows);
  if (item.starts_at) {
    const hours = (Date.parse(item.starts_at) - now) / 3600000;
    if (hours >= -0.5 && hours <= 8) score += 22;
  }
  return score;
}

export function fitReason(item: Item, profile: Profile): string | null {
  if (profile.college && blobOf(item).includes(profile.college.toLowerCase())) {
    return profile.college;
  }
  for (const id of profile.interests) {
    if (itemMatchesInterest(item, id)) {
      return INTERESTS.find((i) => i.id === id)?.label ?? null;
    }
  }
  return null;
}

export function toggleNeed(profile: Profile, needId: string): Profile {
  const need = NEEDS.find((n) => n.id === needId);
  if (!need) return profile;
  const on = profile.needs.includes(needId);
  if (on) {
    const still = new Set(
      NEEDS.filter((n) => n.id !== needId && profile.needs.includes(n.id)).flatMap((n) => n.interests),
    );
    return {
      ...profile,
      needs: profile.needs.filter((id) => id !== needId),
      interests: profile.interests.filter((id) => !need.interests.includes(id) || still.has(id)),
    };
  }
  return {
    ...profile,
    needs: [...profile.needs, needId],
    interests: [...new Set([...profile.interests, ...need.interests])],
  };
}

export function toggleFollow(profile: Profile, sourceId: string): Profile {
  const on = profile.follows.includes(sourceId);
  if (on) return { ...profile, follows: profile.follows.filter((id) => id !== sourceId) };
  if (profile.follows.length >= 24) return profile;
  return { ...profile, follows: [...profile.follows, sourceId], tuned: true };
}

export function toggleInterest(profile: Profile, interestId: string): Profile {
  const on = profile.interests.includes(interestId);
  const interests = on ? profile.interests.filter((id) => id !== interestId) : [...profile.interests, interestId];
  const needs = NEEDS.filter((n) => n.interests.every((id) => interests.includes(id))).map((n) => n.id);
  return { ...profile, interests, needs };
}

export function sourceLabel(source: Item["source"]): string {
  if (source === "email") return "Listserv";
  if (source === "yaleconnect") return "YaleConnect";
  if (source === "campus") return "Campus";
  return "Fizz";
}
