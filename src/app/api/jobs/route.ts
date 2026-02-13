// GET Jobs form Prisma
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { JobStatus } from "@/generated/prisma/enums";
import {
  JobsOrderByWithRelationInput,
  JobsWhereInput,
} from "@/generated/prisma/internal/prismaNamespaceBrowser";
import { z } from "zod";

const QuerySchema = z.object({
  status: z.enum(JobStatus).optional(),
  search: z.string().optional(),
  sortJobDate: z
    .enum(["job_asc", "job_desc", "apply_asc", "apply_desc"])
    .optional()
    .default("job_desc"),
  location: z.string().optional(),
  company: z.string().optional(),
  simpleApply: z.enum(["", "sim", "não"]).optional().default(""),
  // page: z.coerce.number().min(1).default(1),
  // limit: z.coerce.number().min(1).max(100).default(20),
});

// filtro por status e parte do title, opção de ordenar por data de criação (crescente ou decrescente)
export async function GET(request: NextRequest) {
  try {
    const queryParams = request.nextUrl.searchParams;

    const query = QuerySchema.safeParse({
      status: queryParams.get("status") || undefined,
      search: queryParams.get("search") || undefined,
      sortJobDate: queryParams.get("sortJobDate") || undefined,
      location: queryParams.get("location") || undefined,
      company: queryParams.get("company") || undefined,
      simpleApply: queryParams.get("simpleApply") || undefined,
      // page: queryParams.get("page") || undefined,
      // limit: queryParams.get("limit") || undefined,
    });

    if (!query.success) {
      console.error("Invalid query parameters:", query.error.format());
      return NextResponse.json(
        { error: "Invalid query parameters", details: query.error.format() },
        { status: 400 },
      );
    }

    console.log("Search Params:", queryParams.toString());
    console.log("Received query params:", query.data);

    const status = query.data.status;
    const search = query.data.search;
    const order = query.data.sortJobDate;
    const location = query.data.location;
    const company = query.data.company;
    const simpleApply = query.data.simpleApply;
    const whereClause: JobsWhereInput = {};

    if (company) {
      whereClause.company = company;
    }

    if (status) {
      whereClause.status = status as JobStatus;
    }

    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            // mode: "insensitive",
          },
        },
        {
          company: {
            contains: search,
            // mode: "insensitive",
          },
        },
        {
          vagaIdLinkedIn: {
            equals: search,
            // mode: "insensitive",
          },
        },
      ];
    }

    if (location) {
      whereClause.location = {
        contains: location,
        // mode: "insensitive",
      };
    }

    if (simpleApply) {
      whereClause.simpleApply = simpleApply === "sim";
    }

    const orderByClause: JobsOrderByWithRelationInput = {};
    if (order === "job_asc") {
      orderByClause.jobDate = "asc";
    } else if (order === "job_desc") {
      orderByClause.jobDate = "desc";
    } else if (order === "apply_asc") {
      orderByClause.applyDate = "asc";
    } else if (order === "apply_desc") {
      orderByClause.applyDate = "desc";
    }

    console.log("Where Clause:", whereClause);
    console.log("Order By Clause:", orderByClause);

    const jobs = await prisma.jobs.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching jobs." },
      { status: 500 },
    );
  }
}
