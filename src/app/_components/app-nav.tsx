import { type ReactNode } from "react";

import { StorePinIcon } from "~/app/_components/icons";

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
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 transition sm:min-h-14 sm:gap-1 sm:rounded-2xl sm:py-2 ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-fg-subtle hover:text-fg-muted"
      }`}
    >
      {children}
      <span
        className={`text-[10px] leading-none sm:text-xs ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </span>
    </button>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 sm:h-6 sm:w-6"
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
    <StorePinIcon
      className="h-5 w-5 sm:h-6 sm:w-6"
      strokeWidth={active ? 2.25 : 1.75}
    />
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 sm:h-6 sm:w-6"
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
      className="fixed inset-x-0 bottom-0 z-30 px-3 pt-1 pb-[max(0.5rem,var(--spacing-safe-bottom))] sm:px-4 sm:pt-2 sm:pb-[max(1rem,var(--spacing-safe-bottom))]"
    >
      <div className="mx-auto flex w-full max-w-lg gap-0.5 rounded-xl border border-edge/80 bg-surface/95 p-1 shadow-lg shadow-black/10 backdrop-blur-md sm:gap-1 sm:rounded-2xl sm:p-1.5">
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
