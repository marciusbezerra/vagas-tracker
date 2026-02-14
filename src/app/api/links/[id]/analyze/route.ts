// POST /api/links/{id}/analisar
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseJobFromLinkedInLink } from "@/lib/jobParser";
import { JobStatus, Prisma } from "@/generated/prisma/client";

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
    try {
      const jobData = await parseJobFromLinkedInLink(link.url);
      jobData.simpleApply = link.simpleApply;
      jobData.status = link.applied ? JobStatus.APPLIED : JobStatus.NEW;

      if (link.applied && !jobData.applyDate) {
        jobData.applyDate = new Date();
      }

      const newOrUpdatedData = jobData as Prisma.JobsUncheckedCreateInput;

      await prisma.$transaction(async () => {
        await prisma.jobs.upsert({
          where: { vagaIdLinkedIn: jobData.vagaIdLinkedIn || "" },
          create: { ...newOrUpdatedData },
          update: { ...newOrUpdatedData },
        });

        await prisma.links.update({
          where: { id: linkId },
          data: { done: true },
        });
      });

      return NextResponse.json(
        { message: "Link analyzed successfully.", linkId },
        { status: 200 },
      );
    } catch (error) {
      try {
        link.error = (error as Error).message;
        await prisma.links.update({
          where: { id: linkId },
          data: { error: link.error, done: true },
        });
      } catch (updateError) {
        console.error("Error updating link with error message:", updateError);
      }

      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error analyzing link:", error);
    return NextResponse.json(
      { error: "An error occurred while analyzing the link." },
      { status: 500 },
    );
  }
}
