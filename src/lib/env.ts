/** Central place to read feature flags from env. Everything is optional. */
export const env = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  llmApiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "",
  llmBaseUrl: (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
  yaleConnectIcalUrl: process.env.YALECONNECT_ICAL_URL || "",
  ingestSecret: process.env.INGEST_SECRET || "",
  googleId: process.env.GOOGLE_CLIENT_ID || "",
  googleSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  msId: process.env.AZURE_AD_CLIENT_ID || "",
  msSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
  msTenant: process.env.AZURE_AD_TENANT_ID || "common",
  listservSenders: (process.env.LISTSERV_SENDERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
};

export const hasSupabase = () => Boolean(env.supabaseUrl && env.supabaseServiceKey);
export const hasLLM = () => Boolean(env.llmApiKey);
export const hasGoogle = () => Boolean(env.googleId && env.googleSecret);
export const hasMicrosoft = () => Boolean(env.msId && env.msSecret);
/** Email/password is always on. Google and Microsoft are optional extra providers. */
export const hasAuth = () => true;

/** Demo seed: on by default unless SEED_DEMO=false. */
export const seedDemo = () => (process.env.SEED_DEMO ?? "true").toLowerCase() !== "false";
