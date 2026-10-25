"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function joinOfficialHostAction(fd: FormData) {
  const user = await requireUser("/join");
  if (fd.get("agree") !== "on") redirect("/join?error=agree#signup");
  if (!user.officialHost) {
    await db.user.update({ where: { id: user.id }, data: { officialHost: true, hostAgreedAt: new Date() } });
  }
  redirect("/ops");
}
