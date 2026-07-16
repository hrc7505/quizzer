"use client";

import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger, Button } from "@fluentui/react-components";
import { Dismiss20Regular, Warning48Regular } from "@fluentui/react-icons";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Invoked when the user confirms. Close handling is left to the caller. */
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

/**
 * Reusable confirmation dialog (delete / destructive actions).
 * Renders a warning icon, the supplied copy, and Cancel / Confirm buttons.
 * Shared by every admin manager to avoid the same dialog being declared
 * verbatim in five different components.
 */
export function ConfirmDialog({ open, title, description, onConfirm, onOpenChange }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ borderRadius: "12px", padding: "24px", maxWidth: "420px" }}>
        <DialogBody>
          <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
            {title}
          </DialogTitle>
          <DialogContent style={{ paddingTop: "12px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <Warning48Regular style={{ color: "#d13438", fontSize: "24px", flexShrink: 0 }} />
              <span style={{ color: "#616161", fontSize: "14px", lineHeight: "1.5" }}>{description}</span>
            </div>
          </DialogContent>
          <DialogActions style={{ marginTop: "24px" }}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              style={{ backgroundColor: "#d13438", borderColor: "#d13438", color: "#fff" }}
              onClick={async () => {
                await onConfirm();
                onOpenChange(false);
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
