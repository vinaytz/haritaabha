"use client";
import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
  defaultValue,
  className,
}: {
  items: { value: string; title: ReactNode; content: ReactNode }[];
  defaultValue?: string[];
  className?: string;
}) {
  return (
    <A.Root type="multiple" defaultValue={defaultValue} className={cn("border-t border-line", className)}>
      {items.map((item) => (
        <A.Item key={item.value} value={item.value} className="border-b border-line">
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left text-[0.9375rem] font-semibold text-ink hover:text-leaf-deep">
              {item.title}
              <Plus
                className="size-4 shrink-0 text-ink-soft transition-transform duration-200 group-data-[state=open]:rotate-45"
                strokeWidth={2}
              />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden text-[0.9375rem] leading-relaxed text-ink-soft data-[state=closed]:animate-[fade-out_120ms] data-[state=open]:animate-[fade-in_180ms]">
            <div className="pb-5">{item.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
