"use client";

import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  /** Visual container style. "card" matches Card tables, "bare" matches card lists. */
  variant?: "card" | "bare";
}

export function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageSizeChange,
  onPageChange,
  pageSizeOptions = [5, 10, 20, 50],
  variant = "card",
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const containerClass =
    variant === "card"
      ? "flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/40 gap-4 bg-secondary/5 text-xs select-none"
      : "flex flex-col sm:flex-row items-center justify-between p-4 border border-border/80 rounded-2xl gap-4 bg-secondary/5 text-xs select-none";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
        <span>Show</span>
        <Select
          value={pageSize.toString()}
          onChange={e => onPageSizeChange(parseInt(e.target.value))}
          className="h-8 w-16"
        >
          {pageSizeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </Select>
        <span>entries</span>
      </div>

      <span className="text-muted-foreground/80 font-medium">
        Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 font-semibold text-xs"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 font-semibold text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
