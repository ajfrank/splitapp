"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Groups", icon: Home },
  { href: "/groups/new", label: "Add", icon: Plus, isAction: true },
  { href: "/profile", label: "Profile", icon: User },
];

// Check if we're inside a specific group (e.g., /groups/abc-123 or /groups/abc-123/expenses)
function getGroupIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/groups\/([^/]+)/);
  const groupId = match?.[1];
  if (groupId && groupId !== "new") {
    return groupId;
  }
  return null;
}

export function BottomNav() {
  const pathname = usePathname();
  const groupId = getGroupIdFromPath(pathname);

  // If inside a group, plus button creates expense; otherwise creates group
  const plusHref = groupId ? `/groups/${groupId}/expenses/new` : "/groups/new";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 px-4 pb-safe"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAction) {
            const actionLabel = groupId ? "Add new expense" : "Create new group";
            return (
              <Link
                key={item.label}
                href={plusHref}
                className="flex flex-col items-center gap-0.5 -mt-4"
                aria-label={actionLabel}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1",
                isActive ? "text-emerald-600" : "text-gray-400"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
