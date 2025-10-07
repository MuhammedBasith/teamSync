import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | TeamSync",
  description: "Create your TeamSync organization",
};

export default function SignUpPage() {
  return <SignUpForm />;
}

