import { isAdmin } from "@/lib/auth-guard";
import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, createdAt: true },
  });

  const csv = toCsv([
    ["Email", "Signed up (UTC)"],
    ...subscribers.map((subscriber) => [subscriber.email, subscriber.createdAt.toISOString()]),
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
