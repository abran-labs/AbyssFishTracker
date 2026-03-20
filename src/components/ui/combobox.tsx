"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Search } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
  group?: string;
  groupColor?: string;
  groupIcon?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  error = false,
  errorMessage,
  open: controlledOpen,
  onOpenChange,
}: ComboboxProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );
  const [search, setSearch] = React.useState("");
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((opt) => opt.value === value);

  const filtered = React.useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        opt.description?.toLowerCase().includes(lower)
    );
  }, [options, search]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const visible = React.useMemo(() => {
    if (search) return filtered;
    return filtered.filter(
      (opt) => !opt.group || !collapsedGroups.has(opt.group)
    );
  }, [filtered, search, collapsedGroups]);

  // Close on outside click
  const openRef = React.useRef(open);
  openRef.current = open;

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!openRef.current) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when opened
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setOpen(false);
    setSearch("");
  };

  // Keyboard navigation
  const [highlightIndex, setHighlightIndex] = React.useState(0);

  React.useEffect(() => {
    setHighlightIndex(0);
  }, [visible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < visible.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : visible.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (visible[highlightIndex]) {
          handleSelect(visible[highlightIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setSearch("");
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-input",
          open && "ring-1 ring-ring",
          !selected && "text-muted-foreground"
        )}
      >
        <span
          className="truncate"
          style={selected?.color ? { color: selected.color } : undefined}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Error message */}
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search field */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              (() => {
                let visibleIndex = 0;
                let prevGroup: string | undefined;
                return filtered.map((option) => {
                  const showGroupHeader = option.group && option.group !== prevGroup;
                  const isNewGroup = showGroupHeader;
                  if (isNewGroup) prevGroup = option.group;
                  const collapsed = !search && option.group && collapsedGroups.has(option.group);
                  const currentIndex = collapsed ? -1 : visibleIndex++;
                  return (
                    <React.Fragment key={`${option.group ?? ""}-${option.value}`}>
                      {showGroupHeader && (
                        <button
                          type="button"
                          onClick={() => option.group && toggleGroup(option.group)}
                          className={cn(
                            "flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-accent/50 rounded-sm",
                            filtered.indexOf(option) > 0 && "mt-1 border-t pt-2"
                          )}
                          style={option.groupColor ? { color: option.groupColor } : undefined}
                        >
                          <span className="flex items-center gap-1.5">
                            {option.groupIcon && (
                              <img
                                src={option.groupIcon}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            )}
                            {option.group}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 transition-transform",
                              collapsed && "-rotate-90"
                            )}
                          />
                        </button>
                      )}
                      {!collapsed && (
                        <button
                          type="button"
                          onClick={() => handleSelect(option.value)}
                          onMouseEnter={() => setHighlightIndex(currentIndex)}
                          className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
                            currentIndex === highlightIndex && "bg-accent text-accent-foreground",
                            option.value === value && "font-medium"
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <span style={option.color ? { color: option.color } : undefined}>
                              {option.label}
                            </span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            )}
                          </div>
                          {option.value === value && (
                            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      )}
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
