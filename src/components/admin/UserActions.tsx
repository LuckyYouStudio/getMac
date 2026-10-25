import type { User } from "@prisma/client";
import { SubmitButton } from "@/components/SubmitButton";
import { reviewHost, setBanned, setRole } from "@/app/admin/actions/users";

/** 用户行/详情页上的操作按钮组 */
export function UserActions({ user, selfId }: { user: User; selfId: string }) {
  const self = user.id === selfId;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {user.hostStatus === "PENDING" && (
        <>
          <form action={reviewHost}>
            <input type="hidden" name="id" value={user.id} /><input type="hidden" name="hostStatus" value="VERIFIED" />
            <SubmitButton className="btn-safe btn-sm">通过房东认证</SubmitButton>
          </form>
          <form action={reviewHost}>
            <input type="hidden" name="id" value={user.id} /><input type="hidden" name="hostStatus" value="REJECTED" />
            <SubmitButton className="btn-danger btn-sm">拒绝</SubmitButton>
          </form>
        </>
      )}
      {user.hostStatus === "VERIFIED" && !self && (
        <form action={reviewHost}>
          <input type="hidden" name="id" value={user.id} /><input type="hidden" name="hostStatus" value="NONE" />
          <SubmitButton className="btn-ghost btn-sm" confirm="撤销该用户的房东认证？">撤销认证</SubmitButton>
        </form>
      )}
      {!self && (
        <>
          <form action={setRole}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="role" value={user.role === "ADMIN" ? "USER" : "ADMIN"} />
            <SubmitButton className="btn-ghost btn-sm" confirm={user.role === "ADMIN" ? "取消管理员权限？" : "设为管理员？对方将可访问后台。"}>
              {user.role === "ADMIN" ? "取消管理员" : "设为管理员"}
            </SubmitButton>
          </form>
          <form action={setBanned}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="banned" value={user.banned ? "0" : "1"} />
            <SubmitButton
              className={user.banned ? "btn-outline btn-sm" : "btn-danger btn-sm"}
              confirm={user.banned ? undefined : "封禁后该用户无法登录，其发布中的方案会被下架。确定？"}
            >
              {user.banned ? "解封" : "封禁"}
            </SubmitButton>
          </form>
        </>
      )}
      {self && <span className="text-xs text-muted">当前账号</span>}
    </div>
  );
}
