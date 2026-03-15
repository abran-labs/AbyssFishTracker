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
  optimization: number;
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
    optimization: row.optimization,
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
      optimization: data.optimization,
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
      optimization: data.optimization,
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

export async function getServerPondSize(): Promise<number> {
  const { userId } = await requireUser();
  const settings = await prisma.pondSettings.findUnique({
    where: { userId },
  });
  return settings?.size ?? 6;
}

export async function saveServerPondSize(size: number): Promise<void> {
  const { userId } = await requireUser();
  await prisma.pondSettings.upsert({
    where: { userId },
    update: { size },
    create: { userId, size },
  });
}
