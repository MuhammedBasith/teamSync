"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useOrganizationSettings,
  useUpdateOrganizationSettings,
} from "@/hooks/useOrganizationSettings";
import { Save, RefreshCw, Building2, Calendar, CreditCard, Users, Layers } from "lucide-react";
import ColorPicker from "@/components/settings/ColorPicker";
import Spinner from "@/components/loaders/Spinner";
import { ColorPalette } from "@/types/organization";

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: settings, isLoading, error, refetch } = useOrganizationSettings();
  const updateSettings = useUpdateOrganizationSettings();

  const [orgName, setOrgName] = useState("");
  const [colorPalette, setColorPalette] = useState<ColorPalette>({
    primary: "#3B82F6",
    accent: "#8B5CF6",
    background: "#F3F4F6",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect non-owners
  useEffect(() => {
    if (!authLoading && user && user.role !== "owner") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Initialize form with fetched data
  useEffect(() => {
    if (settings) {
      setOrgName(settings.organization.name);
      setColorPalette(settings.organization.colorPalette);
    }
  }, [settings]);

  // Track changes
  useEffect(() => {
    if (settings) {
      const nameChanged = orgName !== settings.organization.name;
      const paletteChanged =
        colorPalette.primary !== settings.organization.colorPalette.primary ||
        colorPalette.accent !== settings.organization.colorPalette.accent ||
        colorPalette.background !== settings.organization.colorPalette.background;

      setHasChanges(nameChanged || paletteChanged);
    }
  }, [orgName, colorPalette, settings]);

  const handleSave = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateSettings.mutateAsync({
        name: orgName,
        colorPalette,
      });

      setSuccessMessage("Organization settings updated successfully!");
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update settings"
      );
    }
  };

  const handleReset = () => {
    if (settings) {
      setOrgName(settings.organization.name);
      setColorPalette(settings.organization.colorPalette);
      setHasChanges(false);
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">
          Failed to load settings: {error.message}
        </p>
      </div>
    );
  }

  // Access denied (non-owners)
  if (!settings?.permissions.canEdit) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Only organization owners can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Organization Settings
      </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your organization's name, color palette, and view quota usage
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Name */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Organization Name
              </h2>
            </div>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Enter organization name"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {orgName.length}/100 characters
            </p>
          </div>

          {/* Color Palette */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Color Palette
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Customize your organization's color scheme. Changes will apply across the dashboard.
            </p>

            <div className="space-y-6">
              {/* Primary Color */}
              <ColorPicker
                label="Primary Color"
                value={colorPalette.primary}
                onChange={(color) =>
                  setColorPalette((prev) => ({ ...prev, primary: color }))
                }
              />

              {/* Accent Color */}
              <ColorPicker
                label="Accent Color"
                value={colorPalette.accent}
                onChange={(color) =>
                  setColorPalette((prev) => ({ ...prev, accent: color }))
                }
              />

              {/* Background Color */}
              <ColorPicker
                label="Background Color"
                value={colorPalette.background}
                onChange={(color) =>
                  setColorPalette((prev) => ({ ...prev, background: color }))
                }
              />
            </div>

            {/* Color Preview */}
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preview
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: colorPalette.primary }}
                  >
                    Primary
                  </div>
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: colorPalette.accent }}
                  >
                    Accent
                  </div>
                  <div
                    className="h-12 rounded-lg flex items-center justify-center text-gray-700 text-sm font-medium border border-gray-300"
                    style={{ backgroundColor: colorPalette.background }}
                  >
                    Background
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              className={`
                inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-all
                ${
                  hasChanges && !updateSettings.isPending
                    ? "bg-brand-500 hover:bg-brand-600 shadow-sm"
                    : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50"
                }
              `}
            >
              {updateSettings.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={!hasChanges || updateSettings.isPending}
              className={`
                inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg transition-all
                ${
                  hasChanges && !updateSettings.isPending
                    ? "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50"
                }
              `}
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Right Column: Read-only Info */}
        <div className="space-y-6">
          {/* Organization Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Organization Details
            </h2>

            <div className="space-y-4">
              {/* Created Date */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Created
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(settings.organization.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Tier */}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {settings.organization.tier.name}
                    {settings.organization.tier.pricePerMonth > 0 &&
                      ` - $${settings.organization.tier.pricePerMonth}/month`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quota Usage */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Quota Usage
            </h2>

            <div className="space-y-4">
              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Members
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.usage.members.current} / {settings.usage.members.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      settings.usage.members.percentage >= 90
                        ? "bg-red-500"
                        : settings.usage.members.percentage >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(settings.usage.members.percentage, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings.usage.members.percentage}% used
                </p>
              </div>

              {/* Teams */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teams
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.usage.teams.current} / {settings.usage.teams.max}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      settings.usage.teams.percentage >= 90
                        ? "bg-red-500"
                        : settings.usage.teams.percentage >= 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(settings.usage.teams.percentage, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings.usage.teams.percentage}% used
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
