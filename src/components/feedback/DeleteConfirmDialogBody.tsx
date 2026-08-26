"use client";

import * as React from "react";
import { AlertTriangle, Link2, Unlink } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

import type { DeleteConfirmDialogBodyProps } from "@/components/feedback/interfaces/DeleteConfirmDialog.interface";

/**
 * DeleteConfirmDialogBody component.
 * Displays clear information about what entity is being deleted, what relations/links it currently has,
 * and confirms that all associations will be cleanly unlinked prior to deletion.
 */
export function DeleteConfirmDialogBody({
  title,
  itemType,
  linkSummaries,
  consequenceMessage,
}: DeleteConfirmDialogBodyProps) {
  const hasLinks = linkSummaries.some((summary) =>
    Array.isArray(summary.items) ? summary.items.length > 0 : summary.items > 0
  );

  return (
    <div className="flex flex-col gap-4 text-xs text-foreground mt-1">
      <div className="flex items-start gap-3 p-3 bg-danger/10 border border-danger/20 rounded-xl">
        <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground text-sm">
            Are you sure you want to delete this {itemType}?
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You are about to permanently delete <strong className="text-foreground">&ldquo;{title}&rdquo;</strong>.
          </p>
        </div>
      </div>

      {hasLinks && (
        <div className="flex flex-col gap-2.5 p-3.5 bg-card/60 border border-border/80 rounded-xl">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <Link2 className="h-4 w-4 text-primary" />
            <span>Active Links &amp; Dependencies:</span>
          </div>

          <div className="flex flex-col gap-2 pl-1">
            {linkSummaries.map((summary, idx) => {
              if (Array.isArray(summary.items)) {
                if (summary.items.length === 0) return null;
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">{summary.label}:</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {summary.items.length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {summary.items.slice(0, 8).map((item, itemIdx) => (
                        <span
                          key={itemIdx}
                          className="px-2 py-0.5 bg-secondary/30 rounded-md text-[11px] text-foreground/80 font-medium"
                        >
                          {item}
                        </span>
                      ))}
                      {summary.items.length > 8 && (
                        <span className="px-1.5 py-0.5 text-[11px] text-muted-foreground italic">
                          +{summary.items.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              if (summary.items <= 0) return null;

              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground">{summary.label}:</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {summary.items}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-2.5 bg-warning/5 border border-warning/20 rounded-lg text-muted-foreground text-[11px]">
        <Unlink className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <span>
          {consequenceMessage ||
            `All active associations will be cleanly unlinked before deletion. This action cannot be reversed.`}
        </span>
      </div>
    </div>
  );
}

export default DeleteConfirmDialogBody;
