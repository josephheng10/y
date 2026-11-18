/**
 * Public Yale channels the digger is allowed to open.
 * Feeds are calendars Yale (or a college) already publishes.
 * Newsletters and Mailman lists are lenses onto those feeds.
 * Nothing here joins a list or reads a subscriber roster.
 */

export type CampusKind = "calendar" | "newsletter" | "list";

export interface CampusFeed {
  type: "ical" | "localist";
  url: string;
}

export interface CampusSource {
  id: string;
  name: string;
  kind: CampusKind;
  blurb: string;
  href: string;
  interests: string[];
  colleges?: string[];
  /** Calendar id this channel reads, when it has no feed of its own. */
  reads?: string;
  feed?: CampusFeed;
}

const DIG_DAYS = 21;

function group(id: string): CampusFeed {
  return {
    type: "localist",
    url: `https://events.yale.edu/api/2/events?group_id=${id}&days=${DIG_DAYS}&pp=12`,
  };
}

function page(slug: string) {
  return `https://events.yale.edu/group/${slug}`;
}

function list(slug: string) {
  return `https://mailman.yale.edu/mailman/listinfo/${slug}`;
}

export const CAMPUS_SOURCES: CampusSource[] = [
  // --- Calendars with a public feed -------------------------------------------------
  {
    id: "athletics",
    name: "Yale Athletics",
    kind: "calendar",
    blurb: "Composite schedule, home and away.",
    href: "https://yalebulldogs.com/calendar",
    interests: ["sports", "outdoors"],
    feed: { type: "ical", url: "https://yalebulldogs.com/calendar.ashx/calendar.ics" },
  },
  {
    id: "law",
    name: "Yale Law School",
    kind: "calendar",
    blurb: "Public talks and panels.",
    href: "https://law.yale.edu/yls-today/events",
    interests: ["career", "research", "culture"],
    feed: { type: "ical", url: "https://www.law.yale.edu/ylsevents.ics" },
  },
  {
    id: "tsai-city",
    name: "Tsai CITY",
    kind: "calendar",
    blurb: "Workshops, mixers, and venture deadlines on the Luma calendar.",
    href: "https://luma.com/attsaiCITY",
    interests: ["career"],
    feed: { type: "ical", url: "https://api.lu.ma/ics/get?entity=calendar&id=cal-3dFlCEjNnwqDQ8a" },
  },
  {
    id: "jackson",
    name: "Jackson School",
    kind: "calendar",
    blurb: "Global affairs talks, including World Fellows.",
    href: "https://events.jackson.yale.edu",
    interests: ["research", "career", "culture"],
    feed: { type: "localist", url: `https://events.jackson.yale.edu/api/2/events?days=${DIG_DAYS}&pp=12` },
  },
  {
    id: "franklin",
    name: "Benjamin Franklin",
    kind: "calendar",
    blurb: "College Google Calendar.",
    href: "https://calendar.google.com/calendar/embed?src=benjaminfranklincollege%40gmail.com",
    interests: ["party", "culture"],
    colleges: ["Benjamin Franklin"],
    feed: { type: "ical", url: "https://calendar.google.com/calendar/ical/benjaminfranklincollege%40gmail.com/public/basic.ics" },
  },
  {
    id: "pauli-murray",
    name: "Pauli Murray",
    kind: "calendar",
    blurb: "College Google Calendar.",
    href: "https://calendar.google.com/calendar/embed?src=ekpht4n98o9q1u3ktso0mphvek%40group.calendar.google.com",
    interests: ["party", "culture"],
    colleges: ["Pauli Murray"],
    feed: { type: "ical", url: "https://calendar.google.com/calendar/ical/ekpht4n98o9q1u3ktso0mphvek%40group.calendar.google.com/public/basic.ics" },
  },
  {
    id: "silliman",
    name: "Silliman",
    kind: "calendar",
    blurb: "College Google Calendar.",
    href: "https://calendar.google.com/calendar/embed?src=414a41e65a878f5141f6f3ba6bea63a3601e213917058d2cd09ff1b91364bfeb%40group.calendar.google.com",
    interests: ["party", "culture"],
    colleges: ["Silliman"],
    feed: { type: "ical", url: "https://calendar.google.com/calendar/ical/414a41e65a878f5141f6f3ba6bea63a3601e213917058d2cd09ff1b91364bfeb%40group.calendar.google.com/public/basic.ics" },
  },
  {
    id: "chaplain-holidays",
    name: "Religious holidays",
    kind: "calendar",
    blurb: "Chaplain's Office holiday calendar.",
    href: "https://chaplain.yale.edu/subscribe-to-religious-holidays-calendar",
    interests: ["culture"],
    feed: { type: "ical", url: "https://calendar.google.com/calendar/ical/1fkc78ne7p70f5dmt8mac79ems%40group.calendar.google.com/public/basic.ics" },
  },
  cal("yale-college", "Yale College", "College-wide events.", ["party", "culture"], "46756206834244", "yale-college"),
  cal("hospitality", "Yale Hospitality", "Dining and buttery-adjacent events.", ["food"], "46756206879302", "yale-hospitality"),
  cal("sustainable-food", "Sustainable Food Program", "Food and farm events.", ["food", "outdoors"], "46756206729790", "sustainable-food-program"),
  cal("som", "School of Management", "Public SOM events on the university calendar.", ["career"], "46056711925778", "school-of-management"),
  cal("ocs", "Office of Career Strategy", "Info sessions and career programs.", ["career"], "46756206532146", "office-of-career-strategy"),
  cal("ventures", "Yale Ventures", "Startup and venture programs.", ["career"], "50570062697974", "yale-ventures"),
  cal("entrepreneurship", "Entrepreneurship at Yale", "Cross-campus venture events.", ["career"], "46756206147100", "entrepreneurship-at-yale"),
  cal("tsai-group", "Tsai CITY on the university calendar", "CITY events that are also posted centrally.", ["career"], "46756206760512", "tsai-center-for-innovative-thinking-at-yale"),
  cal("macmillan", "MacMillan Center", "Area-studies talks.", ["research", "culture"], "46056711669762", "macmillan-center"),
  cal("cmes", "Council on Middle East Studies", "CMES events.", ["research", "culture"], "46056711574518", "council-on-middle-east-studies-cmes"),
  cal("ceas", "Council on East Asian Studies", "CEAS events.", ["research", "culture"], "46013278408511", "council-on-east-asian-studies"),
  cal("cas", "Council on African Studies", "African Studies events.", ["research", "culture"], "46056711533554", "council-on-african-studies-cas"),
  cal("clais", "Latin American & Iberian Studies", "CLAIS events.", ["research", "culture"], "46056711651328", "council-on-latin-american-iberian-studies-clais"),
  cal("south-asia", "South Asian Studies", "South Asia council events.", ["research", "culture"], "46056711756807", "south-asian-studies-council"),
  cal("european", "European Studies", "European Studies council events.", ["research", "culture"], "46056711599096", "european-studies-council"),
  cal("reees", "Russian, East European & Eurasian Studies", "REEES events.", ["research", "culture"], "46056711721989", "russian-east-european-and-eurasian-studies-reees"),
  cal("physics", "Physics", "Physics colloquia.", ["research"], "46056711871502", "physics-department"),
  cal("chemistry", "Chemistry", "Chemistry events.", ["research"], "46056711389152", "chemistry-department"),
  cal("wti", "Wu Tsai Institute", "Neuroscience and cognition.", ["research"], "52496491999008", "wu-tsai-institute"),
  cal("wright", "Wright Lab", "Physics lab events.", ["research"], "46056712014871", "wright-laboratory"),
  cal("yins", "Institute for Network Science", "Network science talks.", ["research"], "46756206894663", "yale-institute-for-network-science"),
  cal("climate", "Yale Climate and Energy Institute", "Climate and energy talks.", ["research", "outdoors"], "46756206812739", "yale-climate-and-energy-institute"),
  cal("environment", "School of the Environment", "YSE events.", ["research", "outdoors"], "50727691562758", "school-of-the-environment"),
  cal("gsas", "Graduate School", "GSAS events.", ["research", "career"], "46056711459817", "graduate-school-of-arts-and-sciences"),
  cal("polisci", "Political Science", "Political science talks.", ["research"], "46756206610999", "political-science-department"),
  cal("economics", "Economics", "Economics talks.", ["research", "career"], "46056711437286", "economics-department"),
  cal("classics", "Classics", "Classics events.", ["arts", "research"], "52877227911610", "department-of-classics"),
  cal("history", "History", "History department events.", ["research", "arts"], "50294102762744", "department-of-history"),
  cal("medieval", "Medieval Studies", "Medieval studies events.", ["research", "arts"], "53683354158920", "medieval-studies"),
  cal("english", "English", "English department events.", ["arts"], "46756206133787", "english-department"),
  cal("wgss", "WGSS", "Women's, Gender, and Sexuality Studies.", ["culture", "research"], "46756206777921", "women-gender-and-sexuality-studies"),
  cal("jewish", "Jewish Studies", "Jewish studies events.", ["culture", "research"], "46756206311972", "jewish-studies-program"),
  cal("global-health", "Global Health", "Global health events.", ["research", "career"], "46756206296611", "global-health"),
  cal("black-studies", "Black Studies", "Black studies events.", ["culture", "research"], "52082868624083", "black-studies"),
  cal("music", "School of Music", "Concerts and recitals.", ["music"], "46756206683707", "school-of-music"),
  cal("yso", "Yale Symphony Orchestra", "YSO concerts.", ["music"], "46056712130595", "yale-symphony-orchestra-yso"),
  cal("glee", "Yale Glee Club", "Glee Club concerts.", ["music"], "46056712095775", "yale-glee-club"),
  cal("bands", "Yale Bands", "Band performances.", ["music"], "46056712052763", "yale-bands"),
  cal("ism", "Institute of Sacred Music", "Sacred music and liturgy.", ["music", "arts"], "46056711482348", "institute-of-sacred-music"),
  cal("yuag", "Yale University Art Gallery", "Gallery programs.", ["arts"], "46756206985804", "yale-university-art-gallery"),
  cal("ycba", "Yale Center for British Art", "British Art programs.", ["arts"], "46056712065052", "yale-center-for-british-art"),
  cal("yale-arts", "Yale Arts", "Aggregated arts events.", ["arts", "music"], "46056712043546", "yale-arts"),
  cal("whc", "Whitney Humanities Center", "Humanities talks.", ["arts", "research"], "46056711945236", "whitney-humanities-center"),
  cal("peabody", "Peabody Museum", "Museum programs.", ["arts", "outdoors"], "53692812181481", "yale-peabody-museum"),
  cal("theater", "Theater Studies", "Shows and workshops.", ["arts", "comedy"], "46756206745151", "theater-studies"),
  cal("drama", "David Geffen School of Drama", "Drama school events.", ["arts", "comedy"], "46756206667322", "school-of-drama"),
  cal("film", "Film at Yale", "Screenings.", ["arts"], "50293954189694", "film-at-yale"),
  cal("schwarzman", "Schwarzman Center", "Performances and nightlife in the center.", ["party", "music", "arts"], "46056712122402", "yale-schwarzman-center"),
  cal("divinity", "Yale Divinity School", "Divinity events.", ["culture", "research"], "46056712088606", "yale-divinity-school"),
  cal("oiss", "OISS", "International student programs.", ["culture"], "46756206564916", "office-of-international-students-and-scholars"),
  cal("afam", "Afro-American Cultural Center", "AfAm house events.", ["culture"], "46056711415779", "afro-american-cultural-center"),
  cal("aacc", "Asian American Cultural Center", "AACC events.", ["culture"], "46056711399393", "asian-american-cultural-center"),
  cal("lacasa", "La Casa", "La Casa events.", ["culture"], "46056711409634", "la-casa-cultural-center"),
  cal("nacc", "Native American Cultural Center", "NACC events.", ["culture"], "46056711422948", "native-american-cultural-center"),
  cal("lgbtq", "Office of LGBTQ Resources", "LGBTQ programs.", ["culture"], "46756206582325", "office-of-lgbtq-resources"),

  // --- Newsletters: the digger reads the public calendar behind the letter ------------
  {
    id: "yale-today",
    name: "Yale Today",
    kind: "newsletter",
    blurb: "Weekday university newsletter. No public event feed. Sign up at Yale News.",
    href: "https://news.yale.edu/",
    interests: ["culture"],
  },
  {
    id: "tsai-letter",
    name: "Tsai CITY newsletter",
    kind: "newsletter",
    blurb: "News and opportunities. This pass reads the CITY Luma calendar.",
    href: "https://city-yale-edu.kit.com/tsai-city-newsletter",
    interests: ["career"],
    reads: "tsai-city",
  },
  {
    id: "som-insights",
    name: "Yale Insights",
    kind: "newsletter",
    blurb: "SOM ideas letter. This pass reads public SOM events.",
    href: "https://insights.som.yale.edu/subscribe-email",
    interests: ["career"],
    reads: "som",
  },
  {
    id: "athletics-text",
    name: "Athletics text updates",
    kind: "newsletter",
    blurb: "Game and ticket texts. This pass reads the composite schedule.",
    href: "https://joinsubtext.com/c/yalebulldogs",
    interests: ["sports"],
    reads: "athletics",
  },
  {
    id: "macmillan-news",
    name: "MacMillan News and Events",
    kind: "newsletter",
    blurb: "Mailchimp news and events. This pass reads the MacMillan calendar.",
    href: "https://yale.us1.list-manage.com/subscribe?id=1d955b060e&u=d2e408bb00d709350d3eee9f4",
    interests: ["research", "culture"],
    reads: "macmillan",
  },
  {
    id: "macmillan-report",
    name: "The MacMillan Report",
    kind: "newsletter",
    blurb: "Interview series. This pass reads the MacMillan calendar.",
    href: "https://yale.us1.list-manage.com/subscribe?id=6358ef10e4&u=d2e408bb00d709350d3eee9f4",
    interests: ["research"],
    reads: "macmillan",
  },
  {
    id: "grand-strategy",
    name: "Grand Strategy",
    kind: "newsletter",
    blurb: "Jackson School letter. This pass reads the Jackson calendar.",
    href: "https://jackson.yale.edu/grand-strategy-program/subscribe",
    interests: ["research", "career"],
    reads: "jackson",
  },
  {
    id: "yse3",
    name: "YSE 3",
    kind: "newsletter",
    blurb: "Environment school letter. This pass reads YSE events.",
    href: "https://yse.to/subscribe",
    interests: ["research", "outdoors"],
    reads: "environment",
  },
  {
    id: "e360",
    name: "Yale Environment 360",
    kind: "newsletter",
    blurb: "Public magazine. No event feed.",
    href: "https://e360.yale.edu",
    interests: ["research", "outdoors"],
  },
  {
    id: "notes-quad",
    name: "Notes from the Quad",
    kind: "newsletter",
    blurb: "Divinity monthly. This pass reads Divinity events.",
    href: "https://divinity.yale.edu/people-impact/yds-publications",
    interests: ["culture"],
    reads: "divinity",
  },
  {
    id: "telegram",
    name: "The Telegram",
    kind: "newsletter",
    blurb: "Chaplain's weekly while classes meet. Join it in Yale Email Subscriptions. This pass reads religious holidays.",
    href: "https://chaplain.yale.edu/news-media/keep-in-touch",
    interests: ["culture"],
    reads: "chaplain-holidays",
  },
  {
    id: "law-weekly",
    name: "YLS events email",
    kind: "newsletter",
    blurb: "Law School weekly and daily event notes. This pass reads the public Law calendar.",
    href: "https://law.yale.edu/yls-today/events",
    interests: ["career", "research"],
    reads: "law",
  },
  {
    id: "liman",
    name: "Liman Center",
    kind: "newsletter",
    blurb: "Fellow and event notes, via Yale Email Subscriptions. This pass reads Law events.",
    href: "https://law.yale.edu/liman/subscribe",
    interests: ["career"],
    reads: "law",
  },
  {
    id: "oiss-letter",
    name: "OISS newsletter",
    kind: "newsletter",
    blurb: "Thursday letter in term. This pass reads the OISS calendar.",
    href: "https://oiss.yale.edu/programs-events/newsletter-social-media",
    interests: ["culture"],
    reads: "oiss",
  },
  {
    id: "your-yale",
    name: "Your Yale",
    kind: "newsletter",
    blurb: "Weekly staff letter. No public event feed.",
    href: "https://your.yale.edu/",
    interests: ["career"],
  },

  // --- Advertised Mailman lists. The digger opens the matching public calendar. ------
  lens("list-cmes", "CMES list", "Council on Middle East Studies.", "cmes", list("cmes"), ["research", "culture"]),
  lens("list-classics", "Friends of Classics", "Classics events for undergraduates.", "classics", list("friendsofclassics"), ["arts", "research"]),
  lens("list-medieval", "Medieval Studies list", "Medieval Studies Program.", "medieval", list("medievalstudies"), ["research", "arts"]),
  lens("list-wgss", "WGSS colloquium", "Graduate colloquium and working group.", "wgss", list("wgss.colloquium"), ["culture", "research"]),
  lens("list-nrg", "Energy Student Interest Group", "NRG / ESIG.", "climate", list("nrg"), ["research", "outdoors"]),
  lens("list-sps", "Society of Physics Students", "Physics student list.", "physics", list("sps"), ["research"]),
  lens("list-wti", "Wu Tsai Institute list", "Updates from the institute.", "wti", list("wti-community"), ["research"]),
  lens("list-afam", "African American Studies newsletter", "Department newsletter list.", "black-studies", list("yaleafricanamericanstudies"), ["culture", "research"]),
  lens("list-history", "Yale Historical Review", "History review list.", "history", list("historical.review"), ["research", "arts"]),
  lens("list-omi", "Open Music Initiative", "Announce list.", "music", list("omi"), ["music"]),
  lens("list-hack", "Hack Yale", "Hackathon organizers and participants.", "entrepreneurship", list("hack_yale"), ["career"]),
  lens("list-ghno", "Global Health Night Out", "Global health list.", "global-health", list("ghno"), ["research"]),
  lens("list-jewish", "Yale/New Haven Jewish happenings", "Grad and professional Jewish life.", "jewish", list("gradprofjews-list"), ["culture"]),
  lens("list-queer", "Queer grads", "LGBTQ+ grad and professional students.", "lgbtq", list("queer.grads"), ["culture"]),
  lens("list-bands", "Yale Bands alumni", "Concerts and alumni news.", "bands", list("yale-bands-alumni"), ["music"]),
  lens("list-ycei", "YCEI seminar", "Climate and energy seminar list.", "climate", list("ycei_seminar"), ["research", "outdoors"]),
  lens("list-british", "British Studies", "British Studies colloquium.", "ycba", list("britishstudies"), ["arts", "research"]),
  {
    id: "list-democrats",
    name: "Yale College Democrats",
    kind: "list",
    blurb: "Advertised list. No public event feed. Connect mail to read it.",
    href: list("democrats"),
    interests: ["culture"],
  },
];

function cal(
  id: string,
  name: string,
  blurb: string,
  interests: string[],
  groupId: string,
  slug: string,
): CampusSource {
  return {
    id,
    name,
    kind: "calendar",
    blurb,
    href: page(slug),
    interests,
    feed: group(groupId),
  };
}

function lens(
  id: string,
  name: string,
  blurb: string,
  reads: string,
  href: string,
  interests: string[],
): CampusSource {
  return { id, name, kind: "list", blurb: `${blurb} This pass reads the matching public calendar.`, href, interests, reads };
}

const BY_ID = new Map(CAMPUS_SOURCES.map((source) => [source.id, source]));

export function campusSource(id: string): CampusSource | undefined {
  return BY_ID.get(id);
}

/** The calendar whose feed this channel actually opens. */
export function feedSource(source: CampusSource): CampusSource | null {
  if (source.feed) return source;
  if (!source.reads) return null;
  const target = BY_ID.get(source.reads);
  return target?.feed ? target : null;
}

export const DIG_CAP = 8;

const STARTER = ["athletics", "tsai-city", "yale-college", "music", "yuag", "schwarzman", "hospitality", "macmillan"];

export function suggestedIds(profile: { interests: string[]; college: string | null }): string[] {
  const interests = new Set(profile.interests);
  const matched = CAMPUS_SOURCES.filter((source) => {
    if (profile.college && source.colleges?.includes(profile.college)) return true;
    return source.interests.some((id) => interests.has(id));
  });
  const rank = (source: CampusSource) => (source.kind === "calendar" ? 0 : source.kind === "newsletter" ? 1 : 2);
  matched.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const ids = matched.map((source) => source.id);
  return (ids.length ? ids : STARTER).slice(0, 12);
}

export interface DigPlan {
  /** Channels the user asked for, or the suggestion when they have not picked. */
  selected: CampusSource[];
  /** Unique calendars this pass will open. */
  pulls: CampusSource[];
  /** Selected channels whose calendar did not fit in this pass. */
  deferred: CampusSource[];
  /** Selected channels with nothing public to open. */
  noFeed: CampusSource[];
  /** True when the plan came from interests or the starter set, not saved picks. */
  automatic: boolean;
}

export function planDig(input: { ids: string[]; interests: string[]; college: string | null }): DigPlan {
  const automatic = input.ids.length === 0;
  const chosen = (automatic ? suggestedIds(input) : input.ids)
    .map((id) => BY_ID.get(id))
    .filter((source): source is CampusSource => Boolean(source));

  const pulls: CampusSource[] = [];
  const seen = new Set<string>();
  const deferred: CampusSource[] = [];
  const noFeed: CampusSource[] = [];

  for (const source of chosen) {
    const feed = feedSource(source);
    if (!feed?.feed) {
      noFeed.push(source);
      continue;
    }
    if (seen.has(feed.feed.url)) continue;
    if (pulls.length >= DIG_CAP) {
      deferred.push(source);
      continue;
    }
    seen.add(feed.feed.url);
    pulls.push(feed);
  }

  return { selected: chosen, pulls, deferred, noFeed, automatic };
}

/** Small rank bump when a saved channel's name shows up on an item. */
export function followedBoost(item: { title: string; summary: string; url: string | null }, follows: string[]): number {
  if (!follows.length) return 0;
  const blob = `${item.title} ${item.summary} ${item.url ?? ""}`.toLowerCase();
  let bonus = 0;
  for (const id of follows) {
    const source = BY_ID.get(id);
    if (source && blob.includes(source.name.toLowerCase())) bonus += 18;
  }
  return Math.min(bonus, 36);
}
