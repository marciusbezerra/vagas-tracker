import { load } from "cheerio";

interface JobUpdate {
  vagaIdLinkedIn?: string;
  company?: string;
  title?: string;
  location?: string;
  type?: string;
  seniority?: string;
  url?: string;
  jobDate?: Date;
}

export async function parseJobFromLinkedInLink(
  link: string
): Promise<JobUpdate> {
  const res = await fetch(link, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  const html = await res.text();
  const $ = load(html);

  const title = $("h1.top-card-layout__title").text().trim();
  const vagaIdLinkedIn = await extractIdFromUrl(link);
  const company = $("a.topcard__org-name-link").text().trim();
  const type = detectType(html);
  const seniority = detectSeniority(html);

  const location =
    $("span.topcard__flavor--bullet").first().text().trim() ||
    $(".job-details-jobs-unified-top-card__job-insight span")
      .first()
      .text()
      .trim() ||
    $(".jobs-unified-top-card__bullet").first().text().trim();

  const jobDateText =
    $("span.posted-time-ago__text").text().trim() ||
    $(".jobs-unified-top-card__posted-date").text().trim();

  let jobDate: Date | null = null;
  if (jobDateText) {
    const match = jobDateText.match(/(\d+)\s+(day|week|month|hour)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      const now = new Date();

      if (unit.startsWith("hour")) {
        now.setHours(now.getHours() - value);
      } else if (unit.startsWith("day")) {
        now.setDate(now.getDate() - value);
      } else if (unit.startsWith("week")) {
        now.setDate(now.getDate() - value * 7);
      } else if (unit.startsWith("month")) {
        now.setMonth(now.getMonth() - value);
      }

      jobDate = now;
    }
  }

  const updateData: JobUpdate = {};

  if (vagaIdLinkedIn) updateData.vagaIdLinkedIn = String(vagaIdLinkedIn);
  if (company) updateData.company = String(company);
  if (title) updateData.title = String(title);
  if (location) updateData.location = String(location);
  if (type) updateData.type = String(type);
  if (seniority) updateData.seniority = String(seniority);
  if (link) updateData.url = link;
  if (jobDate) updateData.jobDate = jobDate;

  console.log("updateData:", updateData);

  return updateData;
}

async function extractIdFromUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : u.href;
  } catch {
    return url;
  }
}

function detectType(text: string) {
  const t = text.toLowerCase();

  if (t.includes("remote") || t.includes("remoto")) return "REMOTO";
  if (t.includes("hybrid") || t.includes("híbrido")) return "HIBRIDO";
  if (t.includes("on-site") || t.includes("presencial")) return "PRESENCIAL";

  return "NAO_DEFINIDO";
}

function detectSeniority(text: string) {
  const t = text.toLowerCase();

  if (t.includes("senior") || t.includes("sr")) return "SENIOR";
  if (t.includes("pleno") || t.includes("mid")) return "PLENO";
  if (t.includes("junior") || t.includes("jr")) return "JUNIOR";

  return "NAO_DEFINIDO";
}
