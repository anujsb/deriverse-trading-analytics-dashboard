"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { BarChart3, History, PieChart, Clock, SlidersHorizontal } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/dashboard#overview", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Trade History", href: "/dashboard#trades", icon: <History className="h-5 w-5" /> },
  { label: "Fees & Order Types", href: "/dashboard#fees", icon: <PieChart className="h-5 w-5" /> },
  { label: "Time-based", href: "/dashboard#time", icon: <Clock className="h-5 w-5" /> },
  { label: "Filters", href: "/dashboard#filters", icon: <SlidersHorizontal className="h-5 w-5" /> },
] as const;

export function DeriverseSidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="px-2 py-1">
            <div className="font-semibold text-gray-900">
              <span className={cn("hidden md:inline", open ? "inline" : "hidden")}>
                Deriverse
              </span>
              <span className={cn("md:hidden", "")}>Deriverse</span>
            </div>
            <div className={cn("text-xs text-gray-500 hidden md:block", open ? "block" : "hidden")}>
              Trading analytics
            </div>
          </div>

          <nav className="mt-2 flex flex-col gap-1" aria-label="Dashboard navigation">
            {nav.map((item) => {
              const active = pathname === "/dashboard";
              return (
                <SidebarLink
                  key={item.href}
                  link={item}
                  className={cn(
                    active ? "" : "",
                    "text-gray-800",
                    "hover:text-blue-700"
                  )}
                />
              );
            })}
          </nav>
        </div>

        <div className="px-2 text-[11px] text-gray-500 hidden md:block">
          <div className={open ? "block" : "hidden"}>
            Tip: hover to expand
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

