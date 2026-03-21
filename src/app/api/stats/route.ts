import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function cached(data: object) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stat = searchParams.get("stat");

  if (stat === "fish") {
    const fish = await prisma.fishEntry.count();
    return cached({
      schemaVersion: 1,
      label: "fish logged",
      message: String(fish),
      color: "orange",
    });
  }

  if (stat === "calculated") {
    const statRecord = await prisma.globalStat.findUnique({
      where: { name: "fish_calculated" }
    });
    return cached({
      schemaVersion: 1,
      label: "fish calculated",
      message: String(statRecord?.value || 0),
      color: "yellow",
    });
  }

  const users = await prisma.user.count();
  return cached({
    schemaVersion: 1,
    label: "users",
    message: String(users),
    color: "blue",
  });
}

export async function POST(request: Request) {
  try {
    const { stat, count } = await request.json();
    if (stat === "calculated" && typeof count === "number" && count > 0) {
      await prisma.globalStat.upsert({
        where: { name: "fish_calculated" },
        update: { value: { increment: count } },
        create: { name: "fish_calculated", value: count },
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
