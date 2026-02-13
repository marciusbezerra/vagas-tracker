import { JobStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const jobId = (await params).id;
    console.log("Updating job with ID:", jobId);
    const body = await request.json();
    console.log("Request body:", body);
    const { status, note, recruiterNotified } = body;

    const job = await prisma.jobs.findUnique({ where: { id: Number(jobId) } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let applyDate = job.applyDate;

    if (job.status !== status && status === JobStatus.APPLIED) {
      applyDate = new Date();
    }

    const updatedJob = await prisma.jobs.update({
      where: { id: Number(jobId) },
      data: {
        status,
        note,
        recruiterNotified,
        applyDate,
      },
    });

    return NextResponse.json({ job: updatedJob }, { status: 200 });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the job." },
      { status: 500 },
    );
  }
}
