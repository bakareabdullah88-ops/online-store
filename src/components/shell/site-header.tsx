"use client";

import Link from "next/link";
import { useMotionValueEvent, useScroll, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  Bell,
  Heart,
  LogOut,
  Moon,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, CountBadge, Kbd } from "@/components/ui/misc";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from "@/components/ui/overlay";
import { useTheme } from "@/components/providers/theme";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";
import { useSession, useSignOut } from "@/queries/session";
import { useUnreadCount } from "@/queries/inbox";
import { useObjectUrl } from "@/queries/media";
import { useBagCount } from "@/stores/bag";
import { useUi } from "@/stores/ui";
import { toast } from "@/stores/toast";
import { Logo } from "./logo";
import { ModeSwitch } from "./mode-switch";

const noopSubscribe = () => () => undefined;

export function useScrolled(threshold = 8) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > threshold));
  return scrolled;
}

export function UserAvatar({ size = 32 }: { size?: number }) {
  const { user } = useSession();
  const url = useObjectUrl(user?.avatar?.kind === "blob" ? user.avatar.id : null);
  if (!user) return null;
  return <Avatar name={user.name} src={url ?? null} size={size} />;
}

/** Bag icon with spring badge; also the landing target for fly-to-bag. */
export function BagButton({ className }: { className?: string }) {
  const count = useBagCount();
  const setBagOpen = useUi((s) => s.setBagOpen);
  const pulse = useUi((s) => s.bagPulse);
  const reduce = useReducedMotion();
  return (
    <Tooltip content="Bag">
      <button
        type="button"
        data-bag-target
        onClick={() => setBagOpen(true)}
        aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-md text-ink hover:bg-ink/[0.06]",
          className,
        )}
      >
        <motion.span
          key={pulse}
          animate={
            reduce || pulse === 0 ? undefined : { scale: [1, 1.25, 0.95, 1], rotate: [0, -8, 4, 0] }
          }
          transition={{ duration: 0.45 }}
        >
          <ShoppingBag className="size-5" />
        </motion.span>
        <CountBadge count={count} className="absolute top-0.5 right-0" />
      </button>
    </Tooltip>
  );
}

export function AccountMenu() {
  const { user } = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  const { resolved, setPreference } = useTheme();
  if (!user) return null;
  const hasShop = user.brandIds.length > 0;
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className="rounded-full ring-offset-2 ring-offset-canvas hover:ring-2 hover:ring-line-strong"
          aria-label="Account menu"
        >
          <UserAvatar size={34} />
        </button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <div className="px-2.5 pt-2 pb-2.5">
          <p className="truncate text-small font-medium">{user.name}</p>
          <p className="truncate text-small text-muted">{user.email}</p>
          {user.isDemo && <p className="mt-1.5 eyebrow text-accent-ink">Demo account</p>}
        </div>
        <MenuSeparator />
        <MenuLabel>Buying</MenuLabel>
        <MenuItem icon={<UserIcon />} onSelect={() => router.push("/account")}>
          Dashboard
        </MenuItem>
        <MenuItem icon={<Receipt />} onSelect={() => router.push("/orders")}>
          Orders
        </MenuItem>
        <MenuItem icon={<Heart />} onSelect={() => router.push("/wishlist")}>
          Saved
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Store />} onSelect={() => router.push(hasShop ? "/studio" : "/open-shop")}>
          {hasShop ? "Shop Studio" : "Open your shop"}
        </MenuItem>
        <MenuItem
          icon={resolved === "dark" ? <Sun /> : <Moon />}
          onSelect={() => setPreference(resolved === "dark" ? "light" : "dark")}
        >
          {resolved === "dark" ? "Light theme" : "Dark theme"}
        </MenuItem>
        <MenuItem icon={<Settings />} onSelect={() => router.push("/account/settings")}>
          Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={<LogOut />}
          onSelect={() =>
            signOut.mutate(undefined, {
              onSuccess: () => {
                router.push("/");
                toast("Signed out");
              },
            })
          }
        >
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function NotificationsButton() {
  const unread = useUnreadCount();
  return (
    <Tooltip content="Notifications">
      <Link
        href="/notifications"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-10 items-center justify-center rounded-md text-ink hover:bg-ink/[0.06]"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring.bouncy}
            className="absolute top-2 right-2.5 size-2 rounded-full bg-accent ring-2 ring-canvas"
            aria-hidden
          />
        )}
      </Link>
    </Tooltip>
  );
}

export function SearchTrigger({ className }: { className?: string }) {
  const setOpen = useUi((s) => s.setCommandOpen);
  const mac = useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => true,
  );
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex h-10 w-full items-center gap-2.5 rounded-full bg-surface px-4 text-left text-small text-muted hairline transition-shadow hover:shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      <Search className="size-4.5 shrink-0" />
      <span className="flex-1 truncate">Search products, brands…</span>
      <span className="hidden items-center gap-1 md:flex" aria-hidden>
        <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

export function SiteHeader({ transparentAtTop = false }: { transparentAtTop?: boolean }) {
  const scrolled = useScrolled();
  const pathname = usePathname() ?? "/";
  const { user, isReady } = useSession();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const solid = scrolled || !transparentAtTop;

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "sticky top-0 z-(--z-header) transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid
          ? "bg-canvas/85 shadow-[0_1px_0_var(--line)] backdrop-blur-lg backdrop-saturate-150"
          : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "container-page flex items-center gap-3 transition-[height] duration-300 ease-out lg:gap-6",
          scrolled ? "h-14" : "h-(--header-h) lg:h-16",
        )}
      >
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {[
            { href: "/explore", label: "Explore" },
            { href: "/explore?sort=newest", label: "New in" },
          ].map((l) => {
            const active = pathname.startsWith("/explore") && l.label === "Explore";
            return (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "rounded-full px-3 py-2 text-small font-medium transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden flex-1 justify-center lg:flex">
          <SearchTrigger className="max-w-md" />
        </div>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-10 lg:hidden"
            aria-label="Search"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-5" />
          </Button>
          {user && <ModeSwitch className="mr-2 hidden lg:inline-flex" />}
          {user && <NotificationsButton />}
          <Tooltip content="Saved">
            <Link
              href="/wishlist"
              aria-label="Saved items"
              className="hidden size-10 items-center justify-center rounded-md hover:bg-ink/[0.06] lg:flex"
            >
              <Heart className="size-5" />
            </Link>
          </Tooltip>
          <BagButton className="hidden lg:flex" />
          <div className="ml-1 hidden min-w-[34px] lg:block">
            {user ? (
              <AccountMenu />
            ) : isReady ? (
              <div className="flex items-center gap-2">
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  variant="ghost"
                  size="sm"
                >
                  Log in
                </ButtonLink>
                <ButtonLink href="/signup" size="sm">
                  Sign up
                </ButtonLink>
              </div>
            ) : null}
          </div>
          {!user && isReady && (
            <ButtonLink
              href={`/login?next=${encodeURIComponent(pathname)}`}
              variant="secondary"
              size="sm"
              className="ml-1 lg:hidden"
            >
              Log in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
