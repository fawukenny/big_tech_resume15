"use client";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the control group */
  ariaLabel: string;
  className?: string;
  /** Disable the whole control */
  disabled?: boolean;
  /** Per-option disable (e.g. PDF view when no PDF was uploaded) */
  disabledOptions?: [boolean, boolean];
};

/**
 * Purple pill segmented control (two options): sliding white thumb, active label in violet.
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
  disabledOptions = [false, false],
}: Props<T>) {
  const [a, b] = options;
  const activeRight = value === b.value;
  const [disA, disB] = disabledOptions;
  const groupDisabled = disabled;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`relative inline-flex h-9 min-w-[200px] max-w-full items-stretch rounded-full bg-violet-600 p-0.5 shadow-inner shadow-black/20 ${groupDisabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
    >
      <span
        className="pointer-events-none absolute top-0.5 bottom-0.5 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out"
        style={{ left: activeRight ? "calc(50% + 2px)" : "2px" }}
        aria-hidden
      />
      <button
        type="button"
        role="radio"
        aria-checked={value === a.value}
        disabled={groupDisabled || disA}
        onClick={() => !disA && onChange(a.value)}
        className={`relative z-10 flex-1 rounded-full px-3 text-center text-xs font-semibold tracking-tight transition-colors ${
          disA ? "cursor-not-allowed opacity-45" : ""
        } ${value === a.value ? "text-violet-800" : "text-white/95 hover:text-white"}`}
      >
        {a.label}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === b.value}
        disabled={groupDisabled || disB}
        onClick={() => !disB && onChange(b.value)}
        className={`relative z-10 flex-1 rounded-full px-3 text-center text-xs font-semibold tracking-tight transition-colors ${
          disB ? "cursor-not-allowed opacity-45" : ""
        } ${value === b.value ? "text-violet-800" : "text-white/95 hover:text-white"}`}
      >
        {b.label}
      </button>
    </div>
  );
}
