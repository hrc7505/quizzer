"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional filter select. When omitted, only the search field renders. */
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions = [],
  filterPlaceholder = "All",
}: SearchFilterBarProps) {
  const hasFilter = filterValue !== undefined && !!onFilterChange;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-border/80 p-4 rounded-xl shadow-xs">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 h-10 w-full"
        />
      </div>
      {hasFilter && (
        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={filterValue}
            onChange={e => onFilterChange!(e.target.value)}
            className="h-10"
          >
            <option value="">{filterPlaceholder}</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
