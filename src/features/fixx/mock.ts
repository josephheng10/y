export type FixxPost = {
  id: string;
  author: string;
  community: string;
  body: string;
  age: string;
  ups: number;
  comments: number;
  tags: string[];
};

/** Mock Fixx feed — no live Fizz / sqlite required. */
export const FIXX_MOCK_POSTS: FixxPost[] = [
  {
    id: "fx-1",
    author: "anon_blue",
    community: "Yale",
    body: "Toad's tonight after 11 — $5 cover with Yale ID, dorm crawl after. Who's pulling up?",
    age: "42m",
    ups: 128,
    comments: 34,
    tags: ["party", "tonight", "toads", "nightlife"],
  },
  {
    id: "fx-2",
    author: "hopper_kitchen",
    community: "Grace Hopper",
    body: "Free dumplings outside Hopper buttery 7–8pm. Bring a container if you want extras for later.",
    age: "1h",
    ups: 96,
    comments: 12,
    tags: ["food", "free food", "hopper", "tonight"],
  },
  {
    id: "fx-3",
    author: "bass_dweller",
    community: "Yale",
    body: "Is Bass always this cold or is facilities mad at us specifically? Layer up if you're locking in tonight.",
    age: "2h",
    ups: 210,
    comments: 41,
    tags: ["bass", "library", "study"],
  },
  {
    id: "fx-4",
    author: "adphi_ops",
    community: "Greek",
    body: "ADPhi semi-formal Friday 9pm. Black tie optional, buses from Old Campus at 8:40. Link in comments.",
    age: "3h",
    ups: 77,
    comments: 19,
    tags: ["party", "formal", "friday", "adphi"],
  },
  {
    id: "fx-5",
    author: "career_peer",
    community: "Careers",
    body: "Consulting coffee chats open tomorrow 10–2 at Rosenfeld. Drop your resume even if you're exploring.",
    age: "5h",
    ups: 54,
    comments: 8,
    tags: ["career", "jobs", "consulting"],
  },
  {
    id: "fx-6",
    author: "im_captain",
    community: "Sports",
    body: "IM basketball playoffs Sunday 4pm at Payne Whitney. Need one sub — DMs open.",
    age: "6h",
    ups: 33,
    comments: 6,
    tags: ["sports", "basketball", "weekend"],
  },
  {
    id: "fx-7",
    author: "aacc_board",
    community: "AACC",
    body: "AACC open mic Thursday 8pm in the house. Food provided, sign-ups at the door.",
    age: "8h",
    ups: 61,
    comments: 11,
    tags: ["culture", "music", "thursday"],
  },
  {
    id: "fx-8",
    author: "sterling_snack",
    community: "Yale",
    body: "Someone's handing out cookies outside Sterling rn. Line is short if you sprint.",
    age: "25m",
    ups: 142,
    comments: 9,
    tags: ["food", "free food", "sterling", "now"],
  },
];

export function listFixxPosts(query = ""): FixxPost[] {
  const q = query.trim().toLowerCase();
  if (!q) return FIXX_MOCK_POSTS;
  return FIXX_MOCK_POSTS.filter((post) => {
    const hay = `${post.body} ${post.author} ${post.community} ${post.tags.join(" ")}`.toLowerCase();
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}

export type FixxChatResult = {
  answer: string;
  sources: Array<{ id: string; title: string; excerpt: string; href: string }>;
};

export function answerFixxQuestion(question: string): FixxChatResult {
  const asked = question.trim().slice(0, 400);
  const words = [...new Set(asked.toLowerCase().match(/[a-z0-9']{2,}/g) ?? [])].filter(
    (w) => !["a", "an", "the", "is", "are", "what", "where", "who", "any", "about", "tonight", "tn"].includes(w),
  );
  const party = /\b(part(?:y|ies)|toads?|formal|mixer|nightlife|going out)\b/i.test(asked);
  const food = /\b(food|eat|cookie|dumpling|pizza|hungry|snack)\b/i.test(asked);

  const scored = FIXX_MOCK_POSTS.map((post) => {
    const hay = `${post.body} ${post.tags.join(" ")}`.toLowerCase();
    let score = words.filter((w) => hay.includes(w)).length * 3;
    if (party && post.tags.some((t) => ["party", "nightlife", "formal", "toads"].includes(t))) score += 6;
    if (food && post.tags.some((t) => ["food", "free food"].includes(t))) score += 6;
    return { post, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const sources = scored.map(({ post }) => ({
    id: post.id,
    title: `${post.author} · ${post.community}`,
    excerpt: post.body.length > 160 ? `${post.body.slice(0, 157)}…` : post.body,
    href: `/posts?q=${encodeURIComponent(post.body.slice(0, 48))}`,
  }));

  if (sources.length === 0) {
    return {
      answer: `I checked the Fixx summary mock feed and didn't find posts matching "${asked}". Try asking about parties, free food, careers, or sports.`,
      sources: [],
    };
  }

  const lines = sources.map((s, i) => `${i + 1}. ${s.excerpt}`);
  const lead = party
    ? "From the Fixx summary (mock campus chatter), these look like plans:"
    : food
      ? "From the Fixx summary, these food-related posts stand out:"
      : "From the Fixx summary mock feed:";

  return {
    answer: `${lead}\n${lines.join("\n")}`,
    sources,
  };
}
