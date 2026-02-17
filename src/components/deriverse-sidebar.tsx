"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Clock } from "lucide-react";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Image from "next/image";

const nav = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    description: "PnL & performance"
  },
  {
    label: "Trades & Fees",
    href: "/dashboard/trades",
    icon: <History className="w-4 h-4" />,
    description: "History & fee breakdown"
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: <Clock className="w-4 h-4" />,
    description: "Time & session stats"
  },
] as const;

export function DeriverseSidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col gap-1">
          {/* Logo */}
          <div className={cn(
            "flex items-center mb-4 px-2 overflow-hidden transition-all",
            open ? "gap-2" : "justify-center"
          )}>
            <div className="relative flex-shrink-0 w-8 h-8">
              <Image
                src="/Deriverse_favicon.ico"
                fill
                alt="Deriverse"
                className="object-contain"
              />
            </div>
            <span className={cn(
              "font-bold text-white text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-150",
              open ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
            )}>
              Deriverse
            </span>
          </div>

          {/* Divider */}
          <div className="mx-2 mb-3 border-[#1e2a3a] border-t" />

          {/* Label */}
          <div className={cn(
            "mb-1 px-2 font-semibold text-[10px] text-gray-600 uppercase tracking-widest transition-all",
            open ? "opacity-100" : "opacity-0"
          )}>
            Navigation
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Dashboard navigation">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <SidebarLink
                  key={item.href}
                  link={item}
                  active={active}
                />
              );
            })}
          </nav>
        </div>

        {/* Footer hint */}
        <div className={cn(
          "px-2 pb-2 transition-all",
          open ? "opacity-100" : "opacity-0"
        )}>
          <div className="bg-[#1e2a3a] px-3 py-2 border border-[#2a3a4a] rounded-md">
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Analytics for on-chain Solana perpetual trades
            </p>
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}