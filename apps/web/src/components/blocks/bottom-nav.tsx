"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  LayoutDashboard,
} from "lucide-react";
import React from "react";

export default function BottomNav() {
  const pathname = usePathname();

  const navigationLinks: {
    href: Route;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border">
      <div
        className="flex justify-around items-center h-16 px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navigationLinks.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors duration-200 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              <div
                className={`flex items-center justify-center size-10 rounded-lg ${
                  isActive ? "bg-foreground/10 text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[11px] mt-0.5 font-medium font-jakarta ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}