import { NextResponse } from "next/server";
import { sendTaskToDailyDashboard } from "@/lib/dailyDashboardSheets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    await sendTaskToDailyDashboard({
      title: body.title,
      dueDate: body.dueDate ?? null,
      notes: body.notes ?? "",
      projectName: body.projectName ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
