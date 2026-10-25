import type { User } from "@prisma/client";
import { SubmitButton } from "@/components/SubmitButton";
import { setBanned, setOfficialHost, setRestricted, setRole } from "@/app/admin/actions/users";

function Toggle({
  action, id, value, label, className, confirm,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string; value: "0" | "1"; label: string; className: string; confirm?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="value" value={value} />
      <SubmitButton className={className} confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}

/** 用户行/详情页上的操作按钮组 */
export function UserActions({ user, selfId }: { user: User; selfId: string }) {
  if (user.id === selfId) return <span className="text-xs text-muted">当前账号</span>;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Toggle
        action={setOfficialHost} id={user.id} value={user.officialHost ? "0" : "1"}
        label={user.officialHost ? "取消官方房东" : "设为官方房东"} className="btn-ghost btn-sm"
        confirm={user.officialHost ? "取消后该用户无法再使用房东后台登记机器，已有机器保留。确定？" : undefined}
      />
      <form action={setRole}>
        <input type="hidden" name="id" value={user.id} />
        <input type="hidden" name="role" value={user.role === "ADMIN" ? "USER" : "ADMIN"} />
        <SubmitButton className="btn-ghost btn-sm" confirm={user.role === "ADMIN" ? "取消管理员权限？" : "设为管理员？对方将可访问后台。"}>
          {user.role === "ADMIN" ? "取消管理员" : "设为管理员"}
        </SubmitButton>
      </form>
      <Toggle
        action={setRestricted} id={user.id} value={user.restricted ? "0" : "1"}
        label={user.restricted ? "解除受限" : "限制"} className={user.restricted ? "btn-outline btn-sm" : "btn-ghost btn-sm text-warn"}
        confirm={user.restricted ? undefined : "受限后对方只能回复已有对话，不能发起咨询或发布内容。确定？"}
      />
      <Toggle
        action={setBanned} id={user.id} value={user.banned ? "0" : "1"}
        label={user.banned ? "恢复账号" : "暂停"} className={user.banned ? "btn-outline btn-sm" : "btn-danger btn-sm"}
        confirm={user.banned ? undefined : "暂停后该用户无法登录，发布中的方案会被下架。确定？"}
      />
    </div>
  );
}
