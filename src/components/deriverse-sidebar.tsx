"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Clock, Brain } from "lucide-react";
import Image from "next/image";

const nav = [
  { label: "Overview",      href: "/dashboard",           icon: LayoutDashboard },
  { label: "Trades & Fees", href: "/dashboard/trades",    icon: History         },
  { label: "Analytics",     href: "/dashboard/analytics", icon: Clock           },
  { label: "AI Summary",    href: "/dashboard/aisummary",        icon: Brain           },
] as const;

export function DeriverseSidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar top-0 z-20 sticky flex flex-col flex-shrink-0 bg-[#0e0f10] border-[#181a1c] border-r w-[52px] hover:w-[200px] h-screen overflow-hidden transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]">

      {/* Logo */}
      <div className="flex flex-shrink-0 items-center gap-[10px] px-[14px] py-4 border-[#181a1c] border-b min-h-[52px] overflow-hidden">
        <div className="relative flex-shrink-0 w-8 h-8">
          <Image
            src="/Deriverse_favicon.ico"
            fill
            alt="Deriverse"
            className="object-contain"
          />
        </div>
        <span className="opacity-0 group-hover/sidebar:opacity-100 font-bold text-white text-xs uppercase tracking-widest whitespace-nowrap transition-[opacity,transform] -translate-x-1 group-hover/sidebar:translate-x-0 duration-[180ms] ease-out">
          Deriverse
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 gap-0.5 px-2 py-[10px] overflow-hidden">

        <div className="opacity-0 group-hover/sidebar:opacity-100 mt-2 mb-1 px-[6px] font-semibold text-[#1e2022] text-[8px] uppercase tracking-[0.18em] whitespace-nowrap transition-opacity duration-[180ms]">
          Navigation
        </div>

        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group/item relative flex items-center gap-[10px] px-2 py-2 rounded font-mono text-[11px] tracking-[0.04em] whitespace-nowrap overflow-hidden transition-[color,background] duration-150",
                active
                  ? "text-[#e2c97e] bg-[rgba(226,201,126,0.07)]"
                  : "text-[#3a3c40] hover:text-[#b0a898] hover:bg-white/[0.025]",
              ].join(" ")}
            >
              {/* Active indicator */}
              {active && (
                <span className="top-1 bottom-1 left-0 absolute bg-[#e2c97e] rounded-r-sm w-0.5" />
              )}

              <span className="flex flex-shrink-0 justify-center items-center w-4 h-4">
                <Icon size={14} />
              </span>

              <span className="opacity-0 group-hover/sidebar:opacity-100 transition-[opacity,transform] -translate-x-1 group-hover/sidebar:translate-x-0 duration-[180ms] ease-out">
                {item.label}
              </span>

              {/* Tooltip — only shows when sidebar is NOT hovered */}
              <span className="top-1/2 left-[calc(100%+12px)] z-30 absolute bg-[#111213] opacity-0 group-hover/item:opacity-100 group-hover/sidebar:!opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.5)] px-[10px] py-[5px] border border-[#1e2022] rounded text-[#b0a898] text-[10px] whitespace-nowrap transition-opacity -translate-y-1/2 duration-100 pointer-events-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 pt-3 pb-4 border-[#181a1c] border-t overflow-hidden">
        <div className="bg-[rgba(226,201,126,0.04)] opacity-0 group-hover/sidebar:opacity-100 px-[11px] py-[9px] border border-[rgba(226,201,126,0.1)] rounded whitespace-nowrap transition-opacity duration-[180ms]">
          <p className="font-mono text-[#2e3033] text-[9px] leading-[1.7] tracking-[0.04em]">
            On-chain Solana<br />perpetual analytics
          </p>
        </div>
        <p className="opacity-0 group-hover/sidebar:opacity-100 mt-[10px] font-mono text-[#181a1c] text-[8px] text-center tracking-[0.14em] whitespace-nowrap transition-opacity duration-[180ms]">
          DERIVERSE · v2.0
        </p>
      </div>

    </aside>
  );
}