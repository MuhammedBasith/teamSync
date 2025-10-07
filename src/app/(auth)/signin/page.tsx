import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | TeamSync",
  description: "Sign in to your TeamSync account",
};

export default function SignInPage() {
  return <SignInForm />;
}

