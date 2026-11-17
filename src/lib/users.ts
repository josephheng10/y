/**
 * Email/password accounts.
 * Stored in .data/users.json (same local fallback as the item store).
 * On a read-only host the map lives in process memory only.
 */
import { promises as fs } from "fs";
import path from "path";
import { hashPassword } from "./passwords";

export interface Account {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

const FILE = path.join(process.cwd(), ".data", "users.json");
const g = globalThis as unknown as { __y_users?: Map<string, Account>; __y_users_loaded?: boolean };
const mem = (g.__y_users ??= new Map<string, Account>());

export class AccountExistsError extends Error {
  constructor() {
    super("exists");
    this.name = "AccountExistsError";
  }
}

async function load() {
  if (g.__y_users_loaded) return;
  g.__y_users_loaded = true;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    for (const account of JSON.parse(raw) as Account[]) mem.set(account.email, account);
  } catch {
    /* no file yet */
  }
}

async function save() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify([...mem.values()], null, 2));
  } catch {
    /* read-only FS */
  }
}

export function validateAccountInput(input: { name: string; email: string; password: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name || name.length > 80) return "Add a name, up to 80 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return "Use a real email address.";
  if (password.length < 8 || password.length > 128) return "Use a password between 8 and 128 characters.";
  return null;
}

export async function findUserByEmail(email: string) {
  await load();
  return mem.get(email.trim().toLowerCase()) ?? null;
}

export async function createUser(input: { name: string; email: string; password: string }) {
  await load();
  const email = input.email.trim().toLowerCase();
  if (mem.has(email)) throw new AccountExistsError();
  const account: Account = {
    id: email,
    email,
    name: input.name.trim(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  mem.set(email, account);
  await save();
  return account;
}
