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
  createdAt: Date;
  updatedAt: Date;
}): FishEntry {
  return {
    id: row.id,
    fishName: row.fishName,
    weight: row.weight,
    stars: row.stars,
    mutation: row.mutation,
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

  // Remove deleted fish from all loadouts
  const snapshots = await prisma.pondSnapshot.findMany({
    where: { userId },
  });
  for (const snap of snapshots) {
    if (snap.fishIds.includes(id)) {
      await prisma.pondSnapshot.update({
        where: { userId_loadoutIndex: { userId, loadoutIndex: snap.loadoutIndex } },
        data: { fishIds: snap.fishIds.filter((fid) => fid !== id) },
      });
    }
  }
}

export interface PondSnapshotData {
  fishIds: string[];
  pondSize: number;
  loadoutIndex: number;
  loadoutName: string | null;
  createdAt: string;
}

function toSnapshotData(row: {
  fishIds: string[];
  pondSize: number;
  loadoutIndex: number;
  loadoutName: string | null;
  createdAt: Date;
}): PondSnapshotData {
  return {
    fishIds: row.fishIds,
    pondSize: row.pondSize,
    loadoutIndex: row.loadoutIndex,
    loadoutName: row.loadoutName,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getServerPondSnapshots(): Promise<PondSnapshotData[]> {
  const { userId } = await requireUser();
  const snapshots = await prisma.pondSnapshot.findMany({
    where: { userId },
    orderBy: { loadoutIndex: "asc" },
  });
  return snapshots.map(toSnapshotData);
}

export async function saveServerPondSnapshot(
  loadoutIndex: number,
  fishIds: string[],
  pondSize: number,
  loadoutName?: string
): Promise<PondSnapshotData> {
  const { userId } = await requireUser();
  const snapshot = await prisma.pondSnapshot.upsert({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
    update: {
      fishIds,
      pondSize,
      createdAt: new Date(),
      ...(loadoutName !== undefined ? { loadoutName } : {}),
    },
    create: {
      userId,
      fishIds,
      pondSize,
      loadoutIndex,
      loadoutName: loadoutName ?? null,
    },
  });
  return toSnapshotData(snapshot);
}

export async function saveServerPondSize(
  pondSize: number
): Promise<PondSnapshotData[]> {
  const { userId } = await requireUser();
  await prisma.pondSnapshot.updateMany({
    where: { userId },
    data: { pondSize },
  });
  // Truncate fishIds for loadouts that now exceed the new pond size
  const snapshots = await prisma.pondSnapshot.findMany({
    where: { userId },
    orderBy: { loadoutIndex: "asc" },
  });
  for (const snap of snapshots) {
    if (snap.fishIds.length > pondSize) {
      await prisma.pondSnapshot.update({
        where: { userId_loadoutIndex: { userId, loadoutIndex: snap.loadoutIndex } },
        data: { fishIds: snap.fishIds.slice(0, pondSize) },
      });
      snap.fishIds = snap.fishIds.slice(0, pondSize);
    }
  }
  return snapshots.map(toSnapshotData);
}

export async function removeFishFromLoadout(
  loadoutIndex: number,
  fishId: string
): Promise<PondSnapshotData> {
  const { userId } = await requireUser();
  const snapshot = await prisma.pondSnapshot.findUnique({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
  });
  if (!snapshot) throw new Error("Loadout not found");
  const updated = await prisma.pondSnapshot.update({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
    data: {
      fishIds: snapshot.fishIds.filter((id) => id !== fishId),
      createdAt: new Date(),
    },
  });
  return toSnapshotData(updated);
}

export async function moveFishBetweenLoadouts(
  fishId: string,
  fromIndex: number,
  toIndex: number
): Promise<{ from: PondSnapshotData; to: PondSnapshotData }> {
  const { userId } = await requireUser();

  // Remove from source
  const source = await prisma.pondSnapshot.findUnique({
    where: { userId_loadoutIndex: { userId, loadoutIndex: fromIndex } },
  });
  if (!source) throw new Error("Source loadout not found");
  const updatedSource = await prisma.pondSnapshot.update({
    where: { userId_loadoutIndex: { userId, loadoutIndex: fromIndex } },
    data: {
      fishIds: source.fishIds.filter((id) => id !== fishId),
      createdAt: new Date(),
    },
  });

  // Add to target (create if doesn't exist)
  const target = await prisma.pondSnapshot.findUnique({
    where: { userId_loadoutIndex: { userId, loadoutIndex: toIndex } },
  });
  const targetFishIds = target ? target.fishIds : [];
  if (!targetFishIds.includes(fishId)) {
    targetFishIds.push(fishId);
  }
  const updatedTarget = await prisma.pondSnapshot.upsert({
    where: { userId_loadoutIndex: { userId, loadoutIndex: toIndex } },
    update: { fishIds: targetFishIds, createdAt: new Date() },
    create: {
      userId,
      loadoutIndex: toIndex,
      fishIds: targetFishIds,
      pondSize: source.pondSize,
    },
  });

  return { from: toSnapshotData(updatedSource), to: toSnapshotData(updatedTarget) };
}

export async function renameLoadout(
  loadoutIndex: number,
  name: string
): Promise<PondSnapshotData> {
  if (loadoutIndex < 2 || loadoutIndex > 4) {
    throw new Error("Only custom loadouts (3-5) can be renamed");
  }
  const { userId } = await requireUser();
  // Use existing pond size from any of the user's snapshots
  const existing = await prisma.pondSnapshot.findFirst({
    where: { userId },
    select: { pondSize: true },
  });
  const snapshot = await prisma.pondSnapshot.upsert({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
    update: { loadoutName: name },
    create: {
      userId,
      loadoutIndex,
      fishIds: [],
      pondSize: existing?.pondSize ?? 6,
      loadoutName: name,
    },
  });
  return toSnapshotData(snapshot);
}

export async function addEntryAndToPond(
  data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">,
  loadoutIndex: number
): Promise<{ entry: FishEntry; snapshot: PondSnapshotData }> {
  const { userId } = await requireUser();

  // Create the fish entry
  const row = await prisma.fishEntry.create({
    data: {
      fishName: data.fishName,
      weight: data.weight,
      stars: data.stars,
      mutation: data.mutation,
      userId,
    },
  });

  // Add to the loadout
  const existing = await prisma.pondSnapshot.findUnique({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
  });
  const fishIds = existing ? [...existing.fishIds, row.id] : [row.id];
  // Use existing pond size, or look up from any other snapshot
  let pondSize = existing?.pondSize;
  if (!pondSize) {
    const any = await prisma.pondSnapshot.findFirst({
      where: { userId },
      select: { pondSize: true },
    });
    pondSize = any?.pondSize ?? 6;
  }
  const snapshot = await prisma.pondSnapshot.upsert({
    where: { userId_loadoutIndex: { userId, loadoutIndex } },
    update: { fishIds, createdAt: new Date() },
    create: {
      userId,
      loadoutIndex,
      fishIds,
      pondSize,
    },
  });

  return { entry: toFishEntry(row), snapshot: toSnapshotData(snapshot) };
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
  pondSortNoticeDismissed: true,
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
