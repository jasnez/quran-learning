import type { ReactElement } from "react";
import { getServerUserRequireConfirmed } from "@/lib/auth/serverAuth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage(): Promise<ReactElement> {
  await getServerUserRequireConfirmed();
  return <ChangePasswordForm />;
}
