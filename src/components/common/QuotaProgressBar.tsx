import React from "react";

interface QuotaProgressBarProps {
  label: string;
  used: number;
  total: number;
  percentage: number;
  icon?: React.ReactNode;
}

export default function QuotaProgressBar({
  label,
  used,
  total,
  percentage,
  icon,
}: QuotaProgressBarProps) {
  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  const getTextColorClass = () => {
    if (percentage >= 90) return "text-red-600 dark:text-red-400";
    if (percentage >= 75) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <span className={`text-sm font-semibold ${getTextColorClass()}`}>
          {used} / {total}
        </span>
      </div>
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${getColorClass()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {percentage}% used
        </span>
        {percentage >= 90 && (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            ⚠️ Nearing limit
          </span>
        )}
      </div>
    </div>
  );
}

