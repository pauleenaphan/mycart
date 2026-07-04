type SettingsToggleProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
  description: string;
  borderBottom?: boolean;
};

export function SettingsToggle({
  checked,
  disabled = false,
  onChange,
  label,
  description,
  borderBottom = false,
}: SettingsToggleProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-4 sm:gap-4 ${
        borderBottom ? "border-b border-stone-100" : ""
      }`}
    >
      <div className="min-w-0 flex-1 pr-1">
        <p className="font-medium text-stone-900">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        data-checked={checked}
        className="app-toggle"
      >
        <span className="app-toggle-thumb" aria-hidden />
      </button>
    </div>
  );
}
