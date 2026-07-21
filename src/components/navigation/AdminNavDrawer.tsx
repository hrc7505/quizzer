"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronUp, ChevronDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { useDialog } from "@/components/providers/OverlayProvider";
import { adminNavLinks, adminTaxonomyLinks, adminTaxonomyConfig } from "@/components/navigation/nav-items";
import { NavLink } from "@/components/navigation/NavLink";

interface AdminNavDrawerProps {
  pathname: string;
  onClose: () => void;
}

export function AdminNavDrawer({ pathname, onClose }: AdminNavDrawerProps) {
  const dialog = useDialog();
  const [isTaxonomyOpen, setIsTaxonomyOpen] = useState(true);

  return (
    <>
      <div className="flex flex-col gap-6 overflow-y-auto pr-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/quizzer.svg" alt="Quizzer Logo" width={71} height={24} className="dark:invert" />
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20">
              Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onClose}
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {adminNavLinks.map((item, idx) => (
            <NavLink key={item.href} item={item} pathname={pathname} onClose={onClose} delay={idx * 60} />
          ))}

          {/* Collapsible Taxonomy sub-category */}
          <div className="flex flex-col animate-fade-in-up" style={{ animationDelay: "120ms", animationFillMode: "both" }}>
            <button
              onClick={() => setIsTaxonomyOpen((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {adminTaxonomyConfig.icon}
                <span>{adminTaxonomyConfig.label}</span>
              </div>
              {isTaxonomyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {isTaxonomyOpen && (
              <div className="pl-8 pr-2 py-1 flex flex-col gap-0.5 border-l border-border/80 ml-5 mt-1">
                {adminTaxonomyLinks.map((item, idx) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onClose={onClose}
                    indent
                    delay={adminTaxonomyConfig.itemBaseDelay + idx * 50}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/80 pt-4">
        <Button
          variant="secondary"
          className="w-full justify-start gap-3 text-sm text-danger hover:bg-danger/10 hover:border-danger/20 font-medium h-10 px-3"
          onClick={() =>
            dialog.confirm({
              title: "Confirm logout",
              description: "Are you sure you want to log out of the admin portal?",
              okText: "Logout",
              okVariant: "danger",
              onConfirm: () => signOut({ callbackUrl: "/auth/admin-signin" }),
            })
          }
        >
          <LogOut className="h-4 w-4" />
          <span>Logout Admin</span>
        </Button>
      </div>
    </>
  );
}
