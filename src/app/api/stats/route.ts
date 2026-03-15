import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stat = searchParams.get("stat");

  if (stat === "fish") {
    const fish = await prisma.fishEntry.count();
    return NextResponse.json({
      schemaVersion: 1,
      label: "fish logged",
      message: String(fish),
      color: "orange",
    });
  }

  const users = await prisma.user.count();
  return NextResponse.json({
    schemaVersion: 1,
    label: "users",
    message: String(users),
    color: "blue",
  });
}
