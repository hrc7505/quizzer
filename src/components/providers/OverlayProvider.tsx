"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { DialogHost } from "@/components/providers/DialogHost";
import { PanelHost } from "@/components/providers/PanelHost";

import type { DialogConfig } from "@/components/providers/DialogHost";
import type { PanelConfig } from "@/components/providers/PanelHost";

interface OverlayContextValue {
  dialog: {
    open: (config: DialogConfig) => void;
    close: () => void;
    confirm: (config: {
      title: React.ReactNode;
      description: React.ReactNode;
      okText?: string;
      cancelText?: string;
      okVariant?: "primary" | "danger";
      onConfirm: () => void | Promise<void>;
    }) => Promise<boolean>;
  };
  panel: {
    open: (config: PanelConfig) => void;
    close: () => void;
  };
}

const OverlayContext = React.createContext<OverlayContextValue | null>(null);

interface OverlayProviderProps {
  children: React.ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const [dialogConfig, setDialogConfig] = React.useState<DialogConfig | null>(null);
  const [panelConfig, setPanelConfig] = React.useState<PanelConfig | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
      setMounted(false);
    };
  }, []);

  const closeDialog = React.useCallback(() => {
    setDialogConfig(prev => {
      prev?.onCancel?.();
      return null;
    });
  }, []);

  const closePanel = React.useCallback(() => {
    setPanelConfig(prev => {
      prev?.onClose?.();
      return null;
    });
  }, []);

  React.useEffect(() => {
    const hasOverlay = !!dialogConfig || !!panelConfig;
    if (hasOverlay) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dialogConfig) closeDialog();
      else if (panelConfig) closePanel();
    };
    if (hasOverlay) window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [dialogConfig, panelConfig, closeDialog, closePanel]);

  const dialog = React.useMemo<OverlayContextValue["dialog"]>(
    () => ({
      open: config => setDialogConfig({ okText: "OK", cancelText: "Cancel", showClose: true, ...config }),
      close: closeDialog,
      confirm: ({ title, description, okText = "Confirm", cancelText = "Cancel", okVariant = "danger", onConfirm }) =>
        new Promise<boolean>(resolve => {
          setDialogConfig({
            title,
            showClose: true,
            body: <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>,
            okText,
            cancelText,
            okVariant,
            onOk: async () => {
              await onConfirm();
              resolve(true);
            },
            onCancel: () => resolve(false),
          });
        }),
    }),
    [closeDialog]
  );

  const panel = React.useMemo<OverlayContextValue["panel"]>(
    () => ({
      open: config => setPanelConfig({ side: "right", width: "max-w-xl", showClose: true, ...config }),
      close: closePanel,
    }),
    [closePanel]
  );

  const value = React.useMemo<OverlayContextValue>(() => ({ dialog, panel }), [dialog, panel]);

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {mounted && createPortal(<DialogHost config={dialogConfig} onClose={closeDialog} />, document.body)}
      {mounted && createPortal(<PanelHost config={panelConfig} onClose={closePanel} />, document.body)}
    </OverlayContext.Provider>
  );
}

function useOverlay() {
  const ctx = React.useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within an <OverlayProvider>");
  return ctx;
}

export function useDialog() {
  return useOverlay().dialog;
}

export function usePanel() {
  return useOverlay().panel;
}
