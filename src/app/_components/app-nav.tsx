import { type ReactNode } from "react";

type AppTab = "list" | "stores" | "profile";

type AppNavProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

type NavItemProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function NavItem({ label, active, onClick, children }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-stone-400 hover:text-stone-600"
      }`}
    >
      {children}
      <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </button>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
      <path
        d="M4 6h.01M4 12h.01M4 18h.01"
        strokeLinecap="round"
        strokeWidth={active ? 3 : 2.5}
      />
    </svg>
  );
}

function StoreIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <path
        d="M12 21s7-5.5 7-12a7 7 0 1 0-14 0c0 6.5 7 12 7 12z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.25 : 1.75}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path
        d="M5.5 20a6.5 6.5 0 0 1 13 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type { AppTab };

export function AppNav({ activeTab, onChange }: AppNavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-[max(1rem,var(--spacing-safe-bottom))]"
    >
      <div className="mx-auto flex w-full max-w-lg gap-1 rounded-2xl border border-stone-200/80 bg-white/95 p-1.5 shadow-lg shadow-stone-900/5 backdrop-blur-md">
        <NavItem
          label="List"
          active={activeTab === "list"}
          onClick={() => onChange("list")}
        >
          <ListIcon active={activeTab === "list"} />
        </NavItem>
        <NavItem
          label="Stores"
          active={activeTab === "stores"}
          onClick={() => onChange("stores")}
        >
          <StoreIcon active={activeTab === "stores"} />
        </NavItem>
        <NavItem
          label="Profile"
          active={activeTab === "profile"}
          onClick={() => onChange("profile")}
        >
          <ProfileIcon active={activeTab === "profile"} />
        </NavItem>
      </div>
    </nav>
  );
}
