"use client";

import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger, Button } from "@fluentui/react-components";
import { Dismiss20Regular, Warning48Regular } from "@fluentui/react-icons";
import { makeStyles, shorthands } from "@fluentui/react-components";

const useStyles = makeStyles({
  surface: {
    borderRadius: "12px",
    padding: "24px",
    maxWidth: "420px",
  },
  content: {
    paddingTop: "12px",
  },
  iconRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  icon: {
    color: "#d13438",
    fontSize: "24px",
    flexShrink: 0,
  },
  description: {
    color: "#616161",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  actions: {
    marginTop: "24px",
  },
  confirmButton: {
    backgroundColor: "#d13438",
    ...shorthands.borderColor("#d13438"),
    color: "#fff",
  },
});

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({ open, title, description, onConfirm, onOpenChange }: ConfirmDialogProps) {
  const styles = useStyles();
  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle action={<DialogTrigger action="close"><Button appearance="subtle" aria-label="close" icon={<Dismiss20Regular />} /></DialogTrigger>}>
            {title}
          </DialogTitle>
          <DialogContent className={styles.content}>
            <div className={styles.iconRow}>
              <Warning48Regular className={styles.icon} />
              <span className={styles.description}>{description}</span>
            </div>
          </DialogContent>
          <DialogActions className={styles.actions}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              className={styles.confirmButton}
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
