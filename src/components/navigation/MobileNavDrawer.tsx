"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { publicNavLinks } from "@/components/navigation/nav-items";
import { NavLink } from "@/components/navigation/NavLink";

interface MobileNavDrawerProps {
  pathname: string;
  onClose: () => void;
}

export function MobileNavDrawer({ pathname, onClose }: MobileNavDrawerProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Image src="/quizzer.svg" alt="Quizzer Logo" width={71} height={24} priority className="dark:invert" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {publicNavLinks.map((link, idx) => (
          <NavLink key={link.href} item={link} pathname={pathname} onClose={onClose} delay={idx * 50} />
        ))}
      </div>
    </div>
  );
}
