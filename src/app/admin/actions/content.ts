"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refreshPublic() {
  revalidatePath("/", "layout");
}

export async function saveFaq(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const data = {
    question: str(fd, "question"),
    answer: str(fd, "answer"),
    category: str(fd, "category") || "machine",
    sort: Number(str(fd, "sort")) || 0,
    published: fd.get("published") === "on",
  };
  if (!data.question || !data.answer) redirect(`/admin/faq?error=${encodeURIComponent("问题和回答不能为空")}`);
  if (id) await db.faq.update({ where: { id }, data });
  else await db.faq.create({ data });
  refreshPublic();
  redirect("/admin/faq");
}

export async function deleteFaq(fd: FormData) {
  await requireAdmin();
  await db.faq.delete({ where: { id: str(fd, "id") } });
  refreshPublic();
}

export async function saveAnnouncement(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const data = { title: str(fd, "title"), body: str(fd, "body"), published: fd.get("published") === "on" };
  if (!data.title) redirect(`/admin/announcements?error=${encodeURIComponent("标题不能为空")}`);
  if (id) await db.announcement.update({ where: { id }, data });
  else await db.announcement.create({ data });
  refreshPublic();
  redirect("/admin/announcements");
}

export async function deleteAnnouncement(fd: FormData) {
  await requireAdmin();
  await db.announcement.delete({ where: { id: str(fd, "id") } });
  refreshPublic();
}
