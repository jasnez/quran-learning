import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { getServerUser } from "@/lib/auth/serverAuth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage(): Promise<ReactElement | void> {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
    return;
  }
  return <ChangePasswordForm />;
}
