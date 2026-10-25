import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** 官方房东机器的运维脚本每 5 分钟调用一次：POST {"token": "..."}（JSON 或表单） */
export async function POST(req: Request) {
  let token = "";
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await req.json()) as { token?: unknown };
      token = typeof body.token === "string" ? body.token : "";
    } else {
      const fd = await req.formData();
      token = String(fd.get("token") ?? "");
    }
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { count } = await db.machine.updateMany({
    where: { heartbeatToken: token },
    data: { heartbeatAt: new Date() },
  });
  if (count === 0) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
