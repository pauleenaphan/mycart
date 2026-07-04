"use client";

import { useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon, StorePinIcon } from "~/app/_components/icons";
import { useClickOutside } from "~/hooks/use-click-outside";

type StoreOption = {
  id: string;
  name: string;
};

type StoreSelectProps = {
  stores: StoreOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export function StoreSelect({
  stores,
  value,
  onValueChange,
}: StoreSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedStore = stores.find((store) => store.id === value);

  useClickOutside(containerRef, () => setOpen(false), open);

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
          <StorePinIcon className="store-select-icon" />
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
