"use client";

// Tappable chip primitives shared by onboarding, the journey hub and the
// invites wizard. Selected state matches the app-wide champagne convention.

interface ChipButtonProps {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}

export function ChipButton({ label, emoji, selected, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        selected
          ? "border-[#4A4E3C] bg-[#c2b280] text-[#4A4E3C]"
          : "border-[#D4D6C0] bg-[#F6F0E8] text-[#656952] hover:border-[#C4C8AE]"
      }`}
    >
      {emoji && <span>{emoji}</span>} {label}
    </button>
  );
}

export interface ChipOption {
  key: string;
  label: string;
  emoji?: string;
}

interface ChipGroupProps {
  options: readonly ChipOption[];
  /** Selected keys — pass a single-element array in "single" mode. */
  value: string[];
  onChange: (keys: string[]) => void;
  mode?: "single" | "multi";
}

export function ChipGroup({ options, value, onChange, mode = "single" }: ChipGroupProps) {
  function toggle(key: string) {
    if (mode === "single") {
      onChange(value.includes(key) ? [] : [key]);
    } else {
      onChange(
        value.includes(key) ? value.filter((k) => k !== key) : [...value, key]
      );
    }
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <ChipButton
          key={o.key}
          label={o.label}
          emoji={o.emoji}
          selected={value.includes(o.key)}
          onClick={() => toggle(o.key)}
        />
      ))}
    </div>
  );
}
