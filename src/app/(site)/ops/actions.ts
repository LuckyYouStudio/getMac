"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CHIPS, MEMORY_OPTIONS, STORAGE_OPTIONS } from "@/lib/constants";
import { parseJson } from "@/lib/json";
import { CHECKLIST } from "@/components/official/checklist";

async function requireOfficialHost() {
  const user = await requireUser("/ops");
  if (!user.officialHost) redirect("/join");
  return user;
}

/** 取当前房东自己的机器，否则 404 回概览 */
async function ownMachine(id: string, userId: string) {
  const m = await db.machine.findUnique({ where: { id } });
  if (!m || m.ownerId !== userId) redirect("/ops");
  return m;
}

const specSchema = z.object({
  location: z.string().trim().min(2, "请填写所在地，如“本拿比 · 铁道镇”").max(40),
  city: z.string().trim().min(1, "请填写城市").max(30),
  chip: z.enum(CHIPS, { message: "请选择芯片" }),
  memory: z.coerce.number().refine((v) => MEMORY_OPTIONS.includes(v), "请选择内存"),
  storage: z.coerce.number().refine((v) => STORAGE_OPTIONS.includes(v), "请选择存储"),
  planId: z.string().min(1, "请选择档位"),
});

function readSpec(fd: FormData) {
  return specSchema.safeParse({
    location: fd.get("location"),
    city: fd.get("city"),
    chip: fd.get("chip"),
    memory: fd.get("memory"),
    storage: fd.get("storage"),
    planId: fd.get("planId"),
  });
}

export async function registerMachineAction(fd: FormData) {
  const user = await requireOfficialHost();
  const name = String(fd.get("name") ?? "").trim();
  const back = (msg: string) => redirect(`/ops/machines/new?error=${encodeURIComponent(msg)}`);
  if (!/^[A-Za-z][A-Za-z ]{1,19}$/.test(name)) back("机器名请用 2–20 个英文字母，如一个美国城市名");
  if (await db.machine.findUnique({ where: { name } })) back(`名字 ${name} 已被占用，换一个吧`);
  const parsed = readSpec(fd);
  if (!parsed.success) back(parsed.error.issues[0].message);
  const spec = parsed.data!;
  if (!(await db.plan.findUnique({ where: { id: spec.planId } }))) back("档位不存在");

  const m = await db.machine.create({
    data: {
      name,
      location: spec.location,
      city: spec.city,
      country: "US",
      chip: `Apple ${spec.chip}`,
      memory: spec.memory,
      storage: spec.storage,
      planId: spec.planId,
      status: "ONBOARDING",
      ownerId: user.id,
      heartbeatToken: randomBytes(24).toString("hex"),
    },
  });
  redirect(`/ops/machines/${m.id}`);
}

export async function updateMachineAction(fd: FormData) {
  const user = await requireOfficialHost();
  const m = await ownMachine(String(fd.get("id")), user.id);
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 500) || null;
  const deliveryCredential = String(fd.get("deliveryCredential") ?? "").trim().slice(0, 1000) || null;

  // 出租中的机器只允许改备注，避免影响正在使用的租客
  if (m.status === "RENTED") {
    await db.machine.update({ where: { id: m.id }, data: { notes } });
  } else {
    const parsed = readSpec(fd);
    if (!parsed.success) redirect(`/ops/machines/${m.id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
    const spec = parsed.data!;
    await db.machine.update({
      where: { id: m.id },
      data: {
        location: spec.location,
        city: spec.city,
        chip: `Apple ${spec.chip}`,
        memory: spec.memory,
        storage: spec.storage,
        planId: spec.planId,
        notes,
        deliveryCredential,
      },
    });
  }
  revalidatePath(`/ops/machines/${m.id}`);
  redirect(`/ops/machines/${m.id}?saved=1`);
}

export async function toggleChecklistAction(fd: FormData) {
  const user = await requireOfficialHost();
  const m = await ownMachine(String(fd.get("id")), user.id);
  const key = String(fd.get("key"));
  const item = CHECKLIST.find((c) => c.key === key);
  if (!item || item.auto || m.status !== "ONBOARDING") redirect(`/ops/machines/${m.id}`);
  const list = parseJson<Record<string, boolean>>(m.checklist, {});
  list[key] = !list[key];
  // 改动清单后需要重新提交审核
  delete list.submitted;
  await db.machine.update({ where: { id: m.id }, data: { checklist: JSON.stringify(list) } });
  revalidatePath(`/ops/machines/${m.id}`);
}

export async function submitForReviewAction(fd: FormData) {
  const user = await requireOfficialHost();
  const m = await ownMachine(String(fd.get("id")), user.id);
  const list = parseJson<Record<string, boolean>>(m.checklist, {});
  const done = CHECKLIST.every((c) => (c.auto ? !!m.heartbeatAt : list[c.key]));
  if (m.status !== "ONBOARDING" || !done || !m.deliveryCredential) {
    redirect(`/ops/machines/${m.id}?error=${encodeURIComponent("清单全部完成并填好交付凭据后才能提交")}`);
  }
  list.submitted = true;
  await db.machine.update({ where: { id: m.id }, data: { checklist: JSON.stringify(list) } });
  revalidatePath(`/ops/machines/${m.id}`);
  redirect(`/ops/machines/${m.id}?submitted=1`);
}

export async function regenerateTokenAction(fd: FormData) {
  const user = await requireOfficialHost();
  const m = await ownMachine(String(fd.get("id")), user.id);
  await db.machine.update({ where: { id: m.id }, data: { heartbeatToken: randomBytes(24).toString("hex") } });
  revalidatePath(`/ops/machines/${m.id}`);
}

export async function savePayoutInfoAction(fd: FormData) {
  const user = await requireOfficialHost();
  const payoutInfo = String(fd.get("payoutInfo") ?? "").trim().slice(0, 500) || null;
  await db.user.update({ where: { id: user.id }, data: { payoutInfo } });
  revalidatePath("/ops/payout");
  redirect("/ops/payout?saved=1");
}
