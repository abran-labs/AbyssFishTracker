import { FishEntry } from "./types";

const STORAGE_KEY = "abyss-fish-log-entries";
const POND_SIZE_KEY = "abyss-fish-log-pond-size";
const PREV_RANKINGS_KEY = "abyss-fish-log-prev-rankings";

export function getEntries(): FishEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveEntries(entries: FishEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(
  entry: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
): FishEntry {
  const entries = getEntries();
  const newEntry: FishEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function updateEntry(
  id: string,
  data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
): FishEntry {
  const entries = getEntries();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) throw new Error("Entry not found");
  entries[index] = {
    ...entries[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveEntries(entries);
  return entries[index];
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  saveEntries(entries);
}

export function restoreEntry(entry: FishEntry): void {
  const entries = getEntries();
  entries.unshift(entry);
  saveEntries(entries);
}

export function getPondSize(): number {
  if (typeof window === "undefined") return 10;
  const raw = localStorage.getItem(POND_SIZE_KEY);
  return raw ? parseInt(raw, 10) : 6;
}

export function savePondSize(size: number): void {
  localStorage.setItem(POND_SIZE_KEY, size.toString());
}

export function getPrevRankings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PREV_RANKINGS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function savePrevRankings(rankings: Record<string, number>): void {
  localStorage.setItem(PREV_RANKINGS_KEY, JSON.stringify(rankings));
}

const PREV_POND_KEY = "abyss-fish-log-prev-pond";

export function getPrevPondSnapshot(): FishEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PREV_POND_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function savePrevPondSnapshot(entries: FishEntry[]): void {
  localStorage.setItem(PREV_POND_KEY, JSON.stringify(entries));
}
