// post que recebe uma lista de links
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { links, simpleApply } = await request.json();
    if (!Array.isArray(links)) {
      return NextResponse.json(
        { error: "Invalid links format. Expected an array." },
        { status: 400 },
      );
    }
    const createdLinks = [];
    for (const url of links) {
      if (!url.startsWith("https://www.linkedin.com/jobs/view/")) {
        continue;
      }
      const urlWithoutParams = url.split("?")[0];
      const existingLink = await prisma.links.findUnique({
        where: { url: urlWithoutParams },
      });
      if (!existingLink) {
        const newLink = await prisma.links.create({
          data: {
            done: false,
            url: urlWithoutParams,
            simpleApply: !!simpleApply,
          },
        });
        createdLinks.push(newLink);
      }
    }
    return NextResponse.json(
      { message: "Links processed successfully.", createdLinks },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing links:", error);
    return NextResponse.json(
      { error: "An error occurred while processing links." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const links = await prisma.links.findMany({
      where: { done: false },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links }, { status: 200 });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching links." },
      { status: 500 },
    );
  }
}
