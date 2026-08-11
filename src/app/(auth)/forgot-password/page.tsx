import type { Metadata } from "next";
import { BrandPanel } from "@/features/auth/components/BrandPanel";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <BrandPanel />
      <ForgotPasswordForm />
    </div>
  );
}