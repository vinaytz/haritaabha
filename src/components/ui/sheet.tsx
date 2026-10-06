"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  side = "right",
  title,
  description,
  children,
  className,
  footer,
}: {
  side?: "right" | "left";
  title: ReactNode;
  description?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-canopy/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-full max-w-[26rem] flex-col bg-paper shadow-float focus:outline-none",
          side === "right"
            ? "right-0 data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in"
            : "left-0 data-[state=closed]:animate-drawer-left-out data-[state=open]:animate-drawer-left-in",
          className,
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Close className="-mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-ink">
            <X className="size-5" strokeWidth={1.75} />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </div>
        {description ? (
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
        ) : (
          <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</Dialog.Description>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-paper p-5">{footer}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
