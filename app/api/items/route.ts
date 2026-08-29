import { NextResponse } from "next/server";
import { createItem } from "@/lib/sheets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.projectId || !body.title) {
      return NextResponse.json({ error: "projectId and title are required" }, { status: 400 });
    }
    const item = await createItem({
      projectId: body.projectId,
      parentId: body.parentId ?? null,
      title: body.title,
      date: body.date ?? null,
      notes: body.notes ?? "",
      status: body.status,
      onDashboard: body.onDashboard,
    });
    return NextResponse.json(item);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
