"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogSurface, DialogTitle, DialogContent, DialogActions } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({ open, title, description, onConfirm, onOpenChange }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogSurface className="max-w-[420px]">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <div className="flex gap-3 items-start mt-2">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground leading-relaxed">{description}</span>
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
