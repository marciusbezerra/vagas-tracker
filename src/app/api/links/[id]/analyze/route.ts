// POST /api/links/{id}/analisar
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJobFromLinkedInLink } from "@/lib/jobParser";
import { Prisma } from "@/generated/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const linkId = parseInt((await params).id, 10);

  console.log("Analyzing link with ID:", linkId);

  if (isNaN(linkId)) {
    return NextResponse.json({ error: "Invalid link ID." }, { status: 400 });
  }

  try {
    const link = await prisma.links.findUnique({
      where: { id: linkId },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    const jobData = await parseJobFromLinkedInLink(link.url);
    jobData.simpleApply = link.simpleApply;

    const newOrUpdatedData = jobData as Prisma.JobsUncheckedCreateInput;

    await prisma.$transaction(async () => {
      await prisma.jobs.upsert({
        where: { vagaIdLinkedIn: jobData.vagaIdLinkedIn || "" },
        create: { ...newOrUpdatedData },
        update: { ...newOrUpdatedData },
      });

      const updatedLink = await prisma.links.update({
        where: { id: linkId },
        data: { done: true },
      });
    });

    return NextResponse.json(
      { message: "Link analyzed successfully.", linkId },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error analyzing link:", error);
    return NextResponse.json(
      { error: "An error occurred while analyzing the link." },
      { status: 500 },
    );
  }
}
