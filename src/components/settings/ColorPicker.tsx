"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

// Predefined color palette for quick selection
const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#A855F7", // Violet
  "#F43F5E", // Rose
];

export default function ColorPicker({
  label,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handlePresetClick = (color: string) => {
    if (!disabled) {
      onChange(color);
      setCustomColor(color);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleInputClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            disabled={disabled}
            className={`
              relative w-full aspect-square rounded-lg border-2 transition-all
              ${
                value === color
                  ? "border-gray-900 dark:border-white scale-110 shadow-lg"
                  : "border-gray-200 dark:border-gray-700 hover:scale-105"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleInputClick}
            disabled={disabled}
            className={`
              w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600
              transition-all hover:scale-105
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
            style={{ backgroundColor: customColor }}
            title="Pick custom color"
          />
          <input
            ref={inputRef}
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            disabled={disabled}
            className="sr-only"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              const newColor = e.target.value;
              if (/^#[0-9A-F]{6}$/i.test(newColor)) {
                setCustomColor(newColor);
                onChange(newColor);
              } else {
                setCustomColor(newColor);
              }
            }}
            disabled={disabled}
            placeholder="#3B82F6"
            className="w-full px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Hex format (e.g., #3B82F6)
          </p>
        </div>
      </div>
    </div>
  );
}

