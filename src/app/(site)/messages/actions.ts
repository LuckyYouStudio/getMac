"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function replyAction(fd: FormData) {
  const inquiryId = String(fd.get("inquiryId") ?? "");
  const user = await requireUser(`/messages/${inquiryId}`);
  const body = String(fd.get("body") ?? "").trim().slice(0, 2000);
  const inquiry = await db.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry || (inquiry.renterId !== user.id && inquiry.hostId !== user.id)) redirect("/messages");
  if (body) {
    await db.message.create({ data: { inquiryId, senderId: user.id, body } });
    await db.inquiry.update({ where: { id: inquiryId }, data: { updatedAt: new Date() } });
  }
  revalidatePath(`/messages/${inquiryId}`);
  redirect(`/messages/${inquiryId}#bottom`);
}
