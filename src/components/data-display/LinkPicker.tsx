"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface LinkPickerItem {
  id: string;
  title: string;
}

interface LinkPickerProps {
  description?: string;
  label: string;
  placeholder?: string;
  items: LinkPickerItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  emptyHint?: string;
}

export function LinkPicker({
  description,
  label,
  placeholder = "Search...",
  items,
  selectedIds,
  onSelectionChange,
  emptyHint = "Try adjusting your search.",
}: LinkPickerProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(
    () => items.filter(i => i.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const toggle = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]
    );
  };

  return (
    <div className="flex flex-col gap-3 mt-3">
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto border border-border/80 rounded-xl p-3 bg-secondary/5 mt-0.5 select-none">
          {filtered.map(item => {
            const isChecked = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2.5 p-1.5 hover:bg-surface-hover rounded-lg cursor-pointer text-xs font-semibold text-foreground/90 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="truncate">{item.title}</span>
              </label>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground font-medium">No items found</p>
              <p className="text-[10px] text-muted-foreground/70">{emptyHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
