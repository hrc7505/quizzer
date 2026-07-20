"use client";

import * as React from "react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface AdminTableProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <Card className={cn("border-border/80 shadow-xs overflow-hidden p-0", className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    </Card>
  );
}
