"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export type HeaderUser = { name: string; email: string; image: string | null; admin: boolean } | null;

export function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" width={size} height={size} className="rounded-full object-cover" referrerPolicy="no-referrer" style={{ width: size, height: size }} />
  ) : (
    <span
      className="grid place-items-center rounded-full bg-leaf-tint text-[0.75rem] font-bold text-leaf-deep"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </span>
  );
}

const item =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.9375rem] text-ink outline-none data-[highlighted]:bg-mist";

export function AccountMenu({ user }: { user: HeaderUser }) {
  const router = useRouter();
  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden h-11 items-center gap-2 rounded-full px-3 text-[0.9375rem] font-medium text-ink hover:bg-mist sm:inline-flex"
      >
        <User className="size-[21px]" strokeWidth={1.6} />
        Sign in
      </Link>
    );
  }
  return (
    <DM.Root modal={false}>
      <DM.Trigger className="hidden size-11 place-items-center rounded-full hover:bg-mist sm:grid" aria-label="Account menu">
        <Avatar name={user.name} image={user.image} />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content
          align="end"
          sideOffset={6}
          className="z-50 w-64 rounded-[var(--radius-surface)] border border-line bg-paper p-1.5 shadow-float animate-pop-in"
        >
          <div className="px-2.5 pb-2 pt-1.5">
            <p className="truncate text-[0.9375rem] font-semibold">{user.name}</p>
            <p className="truncate text-[0.8125rem] text-ink-soft">{user.email}</p>
          </div>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item asChild className={item}>
            <Link href="/account/orders">
              <Package className="size-4 text-ink-soft" /> My orders
            </Link>
          </DM.Item>
          <DM.Item asChild className={item}>
            <Link href="/account/addresses">
              <MapPin className="size-4 text-ink-soft" /> Addresses
            </Link>
          </DM.Item>
          <DM.Item asChild className={item}>
            <Link href="/account">
              <User className="size-4 text-ink-soft" /> Account details
            </Link>
          </DM.Item>
          {user.admin && (
            <>
              <DM.Separator className="my-1 h-px bg-line" />
              <DM.Item asChild className={item}>
                <Link href="/admin">
                  <LayoutDashboard className="size-4 text-ink-soft" /> Admin panel
                </Link>
              </DM.Item>
            </>
          )}
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item
            className={item}
            onSelect={async () => {
              await signOut();
              router.refresh();
            }}
          >
            <LogOut className="size-4 text-ink-soft" /> Sign out
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
