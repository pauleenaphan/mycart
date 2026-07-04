"use client";

import { useEffect, useRef, useState } from "react";

type StoreOption = {
  id: string;
  name: string;
};

type StoreSelectProps = {
  stores: StoreOption[];
  value: string;
  onValueChange: (value: string) => void;
};

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
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

export function StoreSelect({
  stores,
  value,
  onValueChange,
}: StoreSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedStore = stores.find((store) => store.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (!open) return;

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="store-select">
      <button
        type="button"
        className="store-select-row-trigger"
        aria-label={selectedStore ? selectedStore.name : "Choose a store"}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-state={open ? "open" : "closed"}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <span className="store-select-row-icon">
          <StoreIcon className="store-select-icon" />
        </span>
        <span className="store-select-row-value truncate">
          {selectedStore?.name ?? "Choose a store"}
        </span>
        <ChevronDownIcon className="store-select-row-chevron" />
      </button>

      {open && (
        <div className="store-select-menu" role="listbox">
          <ul className="store-select-viewport">
            {stores.map((store) => {
              const selected = store.id === value;

              return (
                <li key={store.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`store-select-item w-full ${
                      selected ? "store-select-item-selected" : ""
                    }`}
                    onClick={() => {
                      onValueChange(store.id);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{store.name}</span>
                    {selected && (
                      <span className="store-select-check">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
