"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Back to Flow home"
      className={cn(
        "hidden md:inline-flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-primary transition-colors focus-ring rounded-md px-1.5 py-1",
        className
      )}
    >
      <ArrowLeft className="w-3 h-3" />
      Home
    </Link>
  );
}
