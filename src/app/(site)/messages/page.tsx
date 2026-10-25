import { redirect } from "next/navigation";

// 站内消息已并入租赁市场
export default function MessagesRedirect() {
  redirect("/market/messages");
}
