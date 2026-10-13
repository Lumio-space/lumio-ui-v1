import type { Metadata } from "next";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <BrandPanel />
      <ResetPasswordForm />
    </div>
  );
}