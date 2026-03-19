"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { type FishEntry } from "@/lib/types";

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

function toFishEntry(row: {
  id: string;
  fishName: string;
  weight: number;
  stars: number;
  mutation: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}): FishEntry {
  return {
    id: row.id,
    fishName: row.fishName,
    weight: row.weight,
    stars: row.stars,
    mutation: row.mutation,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getServerEntries(): Promise<FishEntry[]> {
  const { userId } = await requireUser();
  const rows = await prisma.fishEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toFishEntry);
}

export async function addServerEntry(
  data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
): Promise<FishEntry> {
  const { userId } = await requireUser();
  const row = await prisma.fishEntry.create({
    data: {
      fishName: data.fishName,
      weight: data.weight,
      stars: data.stars,
      mutation: data.mutation,
      value: data.value,
      userId,
    },
  });
  return toFishEntry(row);
}

export async function updateServerEntry(
  id: string,
  data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
): Promise<FishEntry> {
  const { userId } = await requireUser();

  // Verify ownership
  const existing = await prisma.fishEntry.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Entry not found");

  const row = await prisma.fishEntry.update({
    where: { id },
    data: {
      fishName: data.fishName,
      weight: data.weight,
      stars: data.stars,
      mutation: data.mutation,
      value: data.value,
    },
  });
  return toFishEntry(row);
}

export async function deleteServerEntry(id: string): Promise<void> {
  const { userId } = await requireUser();

  // Verify ownership
  const existing = await prisma.fishEntry.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Entry not found");

  await prisma.fishEntry.delete({ where: { id } });
}

export interface PondSnapshotData {
  fishIds: string[];
  pondSize: number;
  createdAt: string;
}

export async function getServerPondSnapshot(): Promise<PondSnapshotData | null> {
  const { userId } = await requireUser();
  const snapshot = await prisma.pondSnapshot.findUnique({
    where: { userId },
  });
  if (!snapshot) return null;
  return {
    fishIds: snapshot.fishIds,
    pondSize: snapshot.pondSize,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export async function saveServerPondSnapshot(
  fishIds: string[],
  pondSize: number
): Promise<PondSnapshotData> {
  const { userId } = await requireUser();
  const snapshot = await prisma.pondSnapshot.upsert({
    where: { userId },
    update: { fishIds, pondSize, createdAt: new Date() },
    create: { userId, fishIds, pondSize },
  });
  return {
    fishIds: snapshot.fishIds,
    pondSize: snapshot.pondSize,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

export async function saveServerPondSize(
  pondSize: number
): Promise<PondSnapshotData> {
  const { userId } = await requireUser();
  const snapshot = await prisma.pondSnapshot.upsert({
    where: { userId },
    update: { pondSize },
    create: { userId, fishIds: [], pondSize },
  });
  return {
    fishIds: snapshot.fishIds,
    pondSize: snapshot.pondSize,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

// --- User Settings ---

export interface UserSettingsData {
  race: string;
  artifact1: string;
  artifact2: string;
  artifact3: string;
  roeStorageLevel: number;
  decorationLevel: number;
  pondSortNoticeDismissed: boolean;
  ignoredSwapFishIds: string[];
  pondIsOffline: boolean;
  pondFeedType: string;
  pondFeedBags: number;
  pondReminderFeedAt: string | null;
  pondReminderStorageAt: string | null;
}

const DEFAULT_SETTINGS: UserSettingsData = {
  race: "None",
  artifact1: "None",
  artifact2: "None",
  artifact3: "None",
  roeStorageLevel: 0,
  decorationLevel: 0,
  pondSortNoticeDismissed: false,
  ignoredSwapFishIds: [],
  pondIsOffline: true,
  pondFeedType: "None",
  pondFeedBags: 1,
  pondReminderFeedAt: null,
  pondReminderStorageAt: null,
};

// Returns null if no settings record exists yet (new account — caller should migrate from localStorage)
export async function getServerSettings(): Promise<UserSettingsData | null> {
  const { userId } = await requireUser();
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  if (!settings) return null;
  return {
    race: settings.race,
    artifact1: settings.artifact1,
    artifact2: settings.artifact2,
    artifact3: settings.artifact3,
    roeStorageLevel: settings.roeStorageLevel,
    decorationLevel: settings.decorationLevel,
    pondSortNoticeDismissed: settings.pondSortNoticeDismissed,
    ignoredSwapFishIds: settings.ignoredSwapFishIds,
    pondIsOffline: settings.pondIsOffline,
    pondFeedType: settings.pondFeedType,
    pondFeedBags: settings.pondFeedBags,
    pondReminderFeedAt: settings.pondReminderFeedAt?.toISOString() ?? null,
    pondReminderStorageAt: settings.pondReminderStorageAt?.toISOString() ?? null,
  };
}

export async function saveServerSettings(
  data: Partial<UserSettingsData>
): Promise<UserSettingsData> {
  const { userId } = await requireUser();

  // Convert ISO string timestamps to Date objects for Prisma DateTime fields
  const { pondReminderFeedAt, pondReminderStorageAt, ...rest } = data;
  const prismaData = {
    ...rest,
    ...(pondReminderFeedAt !== undefined
      ? { pondReminderFeedAt: pondReminderFeedAt ? new Date(pondReminderFeedAt) : null }
      : {}),
    ...(pondReminderStorageAt !== undefined
      ? { pondReminderStorageAt: pondReminderStorageAt ? new Date(pondReminderStorageAt) : null }
      : {}),
  };

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: prismaData,
    create: { userId, ...DEFAULT_SETTINGS, ...prismaData },
  });
  return {
    race: settings.race,
    artifact1: settings.artifact1,
    artifact2: settings.artifact2,
    artifact3: settings.artifact3,
    roeStorageLevel: settings.roeStorageLevel,
    decorationLevel: settings.decorationLevel,
    pondSortNoticeDismissed: settings.pondSortNoticeDismissed,
    ignoredSwapFishIds: settings.ignoredSwapFishIds,
    pondIsOffline: settings.pondIsOffline,
    pondFeedType: settings.pondFeedType,
    pondFeedBags: settings.pondFeedBags,
    pondReminderFeedAt: settings.pondReminderFeedAt?.toISOString() ?? null,
    pondReminderStorageAt: settings.pondReminderStorageAt?.toISOString() ?? null,
  };
}
