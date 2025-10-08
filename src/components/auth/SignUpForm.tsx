"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type InviteData = {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
    color_palette?: {
      primary: string;
      accent: string;
      background: string;
    };
  };
};

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signUp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationName: "",
    colorPalette: {
      primary: "#3B82F6",
      accent: "#10B981",
      background: "#F3F4F6",
    },
  });

  const inviteCode = searchParams?.get("inviteCode");
  const isInvitedSignup = !!inviteCode;

  // Fetch invite data if invite code is present
  useEffect(() => {
    if (inviteCode) {
      setLoadingInvite(true);
      fetch(`/api/invite/validate?code=${inviteCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.invite) {
            setInviteData(data.invite);
            setFormData((prev) => ({
              ...prev,
              email: data.invite.email, // Prefill email
            }));
            setError(null);
          } else {
            setError(data.error || "Invalid invite code");
          }
        })
        .catch((err) => {
          setError("Failed to validate invite code");
          console.error(err);
        })
        .finally(() => {
          setLoadingInvite(false);
        });
    }
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isInvitedSignup && !formData.organizationName) {
      setError("Organization name is required");
      return;
    }

    if (!isChecked) {
      setError("Please agree to the Terms and Conditions");
      return;
    }

    try {
      setLoading(true);

      if (isInvitedSignup && inviteCode) {
        // Invited user signup
        await signUp({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          inviteCode,
        });
      } else {
        // Owner signup
        await signUp({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName,
          colorPalette: formData.colorPalette,
        });
      }

      // Success - redirect handled by signUp function
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to signin
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pb-10">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {isInvitedSignup ? "Join Organization" : "Create Account"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isInvitedSignup
                ? `You've been invited to join ${inviteData?.organization.name || "an organization"}`
                : "Create your organization and start managing your team"}
            </p>
          </div>

          {/* Show invite info if present */}
          {isInvitedSignup && inviteData && (
            <div className="mb-5 p-4 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Organization:</strong> {inviteData.organization.name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Role:</strong> {inviteData.role}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading invite */}
          {loadingInvite && (
            <div className="mb-5 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Validating invite...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* First Name */}
                <div className="sm:col-span-1">
                  <Label>
                    First Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                {/* Last Name */}
                <div className="sm:col-span-1">
                  <Label>
                    Last Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isInvitedSignup} // Email is prefilled and locked for invited users
                  required
                />
                {isInvitedSignup && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email is pre-filled from your invitation
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Organization Name - Only for owner signup */}
              {!isInvitedSignup && (
                <div>
                  <Label>
                    Organization Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Enter your organization name"
                    required
                  />
                </div>
              )}

              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <Checkbox
                  className="w-5 h-5 mt-0.5"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  By creating an account means you agree to the{" "}
                  <span className="text-gray-800 dark:text-white/90">
                    Terms and Conditions
                  </span>
                  , and our{" "}
                  <span className="text-gray-800 dark:text-white">
                    Privacy Policy
                  </span>
                </p>
              </div>

              {/* Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || loadingInvite}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
