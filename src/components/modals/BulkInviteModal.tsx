"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle, Loader2, Users } from "lucide-react";
import { downloadCSVTemplate, parseCSV } from "@/lib/utils/csvTemplate";

interface BulkInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string; // Required: The team to invite members to
}

type Step = "upload" | "validation" | "preview" | "sending" | "complete";

type ValidationResult = {
  valid: Array<{ email: string; role: string }>;
  errors: Array<{ email: string; error: string }>;
  quotaCheck: {
    currentMembers: number;
    maxMembers: number;
    requestedCount: number;
    remainingSlots: number;
    canInvite: boolean;
  };
};

type SendResult = {
  email: string;
  success: boolean;
  error?: string;
};

export default function BulkInviteModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
}: BulkInviteModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvErrors, setCSVErrors] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [currentSending, setCurrentSending] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setCSVErrors([]);
    setValidationResult(null);
    setSendResults([]);
    setCurrentSending(0);
    setIsProcessing(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetModal();
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setCSVErrors([]);
    } else {
      setCSVErrors(["Please select a valid CSV file"]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleValidate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStep("validation");
    setCSVErrors([]);

    try {
      // Read file
      const text = await file.text();
      
      // Parse CSV
      const parseResult = parseCSV(text);
      
      if (!parseResult.success || !parseResult.data) {
        setCSVErrors(parseResult.errors || ["Failed to parse CSV"]);
        setStep("upload");
        setIsProcessing(false);
        return;
      }

      // Validate with backend
      const response = await fetch("/api/invite/bulk/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites: parseResult.data }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.quotaCheck && !result.quotaCheck.canInvite) {
          setCSVErrors([
            `Quota Exceeded: You're trying to invite ${result.quotaCheck.requestedCount} members, but only ${result.quotaCheck.remainingSlots} slots remaining.`,
            `Current members: ${result.quotaCheck.currentMembers}/${result.quotaCheck.maxMembers}`,
          ]);
        } else {
          setCSVErrors([result.error || "Validation failed"]);
        }
        setStep("upload");
        setIsProcessing(false);
        return;
      }

      setValidationResult(result);

      if (result.errors.length > 0) {
        setCSVErrors(result.errors.map((e: any) => `${e.email}: ${e.error}`));
        setStep("upload");
      } else {
        setStep("preview");
      }
    } catch (error) {
      setCSVErrors([
        error instanceof Error ? error.message : "Failed to validate CSV",
      ]);
      setStep("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;

    setIsProcessing(true);
    setStep("sending");
    setCurrentSending(0);
    setSendResults([]);

    try {
      const response = await fetch("/api/invite/bulk/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invites: validationResult.valid,
          teamId: teamId, // Pass the team ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invites");
      }

      setSendResults(result.results);
      setStep("complete");
      
      // Call onSuccess after a short delay to show completion
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setCSVErrors([
        error instanceof Error ? error.message : "Failed to send invites",
      ]);
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 min-h-screen w-screen bg-black/30 backdrop-blur-sm z-[100000] transition-all duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-500/10 rounded-lg">
                <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Bulk Invite Members
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload CSV to invite multiple members at once
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Upload Step */}
            {step === "upload" && (
              <div className="space-y-6">
                {/* Download Template */}
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Step 1: Download Template
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
                        Download our CSV template, fill it with email addresses (one per row), and upload it back.
                      </p>
                      <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Download Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Area */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Step 2: Upload Filled CSV
                  </h4>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-brand-500 dark:hover:border-brand-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV file only
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>

                  {file && (
                    <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 dark:text-green-300 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {csvErrors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                          Validation Errors
                        </h4>
                        <ul className="space-y-1">
                          {csvErrors.map((error, index) => (
                            <li
                              key={index}
                              className="text-sm text-red-800 dark:text-red-400"
                            >
                              • {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Important Note */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
                        Important Notes
                      </h4>
                      <ul className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
                        <li>• Only <strong>member</strong> role is allowed in bulk invites</li>
                        <li>• Maximum <strong>50 invites</strong> per batch</li>
                        <li>• Duplicate emails will be automatically skipped</li>
                        <li>• Invites are subject to your tier&apos;s quota limits</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Step */}
            {step === "validation" && (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto text-brand-500 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Validating CSV...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Checking emails, duplicates, and quota limits
                </p>
              </div>
            )}

            {/* Preview Step */}
            {step === "preview" && validationResult && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {validationResult.valid.length}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Valid Invites
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {validationResult.quotaCheck.remainingSlots}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Slots Remaining
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {validationResult.quotaCheck.currentMembers}/{validationResult.quotaCheck.maxMembers}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      Current Usage
                    </p>
                  </div>
                </div>

                {/* Email List */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Ready to Send ({validationResult.valid.length} invites)
                  </h4>
                  <div className="max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    {validationResult.valid.map((invite, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>{invite.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    ⚠️ Emails will be sent with small delays to avoid rate limiting. This may take a few moments.
                  </p>
                </div>
              </div>
            )}

            {/* Sending Step */}
            {step === "sending" && (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 mx-auto text-brand-500 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sending Invites...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please wait while we send invitation emails
                </p>
                {validationResult && (
                  <div className="mt-6 max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{sendResults.length} / {validationResult.valid.length}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 transition-all duration-300"
                        style={{
                          width: `${(sendResults.length / validationResult.valid.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Step */}
            {step === "complete" && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Invites Sent Successfully!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {sendResults.filter((r) => r.success).length} invitation emails sent
                </p>

                {/* Results Summary */}
                <div className="max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {sendResults.filter((r) => r.success).length}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                        Successful
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {sendResults.filter((r) => !r.success).length}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        Failed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Failed Invites */}
                {sendResults.some((r) => !r.success) && (
                  <div className="mt-6 max-w-md mx-auto text-left">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Failed Invites:
                    </h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 space-y-1">
                      {sendResults
                        .filter((r) => !r.success)
                        .map((result, index) => (
                          <p
                            key={index}
                            className="text-xs text-red-800 dark:text-red-400"
                          >
                            • {result.email}: {result.error}
                          </p>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            {step === "upload" && (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidate}
                  disabled={!file || isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Validate & Continue
                </button>
              </>
            )}

            {step === "preview" && (
              <>
                <button
                  onClick={() => {
                    setStep("upload");
                    setValidationResult(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send {validationResult?.valid.length} Invites
                </button>
              </>
            )}

            {step === "complete" && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

