// GET Jobs form Prisma
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.jobs.findMany();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching jobs." },
      { status: 500 }
    );
  }
}
