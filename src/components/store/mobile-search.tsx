"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { SearchBox } from "./search-box";

export function MobileSearch() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="grid size-11 place-items-center rounded-full text-ink hover:bg-mist md:hidden" aria-label="Search">
        <Search className="size-[21px]" strokeWidth={1.6} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-canopy/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-50 bg-paper p-4 pb-6 shadow-float data-[state=open]:animate-fade-in">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">Search plants and planters</Dialog.Description>
          <div className="flex items-start gap-2">
            <SearchBox autoFocus className="flex-1" onNavigate={() => setOpen(false)} />
            <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-mist">
              <X className="size-5" />
              <span className="sr-only">Close search</span>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
