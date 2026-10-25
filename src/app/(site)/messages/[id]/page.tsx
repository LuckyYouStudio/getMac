import { redirect } from "next/navigation";

export default async function MessageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/market/messages/${id}`);
}
