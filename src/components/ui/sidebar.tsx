"use client";

import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarLinkItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <Sidebar />");
  return ctx;
}

export function Sidebar({
  children,
  open: openProp,
  setOpen: setOpenProp,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarBody({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
}

export function DesktopSidebar({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  const { open, setOpen } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col bg-[#0d1117] border-[#1e2a3a] border-r h-full min-h-screen transition-[width] duration-200 ease-out",
        open ? "w-[220px]" : "w-[60px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label="Sidebar"
    >
      <div className="flex flex-col gap-2 px-2 py-4 h-full">{children}</div>
    </aside>
  );
}

export function MobileSidebar({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  const { open, setOpen } = useSidebar();

  return (
    <div className={cn("md:hidden", className)}>
      <div className="flex justify-between items-center bg-[#0d1117] px-4 border-[#1e2a3a] border-b h-14">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex justify-center items-center hover:bg-[#1e2a3a] p-2 rounded-md text-gray-400"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="font-semibold text-white text-sm uppercase tracking-widest">
          Deriverse
        </div>
        <div className="w-9" />
      </div>

      {open && (
        <div
          className="z-50 fixed inset-0 bg-black/60"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="top-0 left-0 absolute flex flex-col bg-[#0d1117] shadow-2xl p-4 border-[#1e2a3a] border-r w-[85%] max-w-sm h-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-white text-sm uppercase tracking-widest">Deriverse</div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex justify-center items-center hover:bg-[#1e2a3a] p-2 rounded-md text-gray-400"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarLink({
  link,
  className,
  active,
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
  active?: boolean;
} & Omit<LinkProps, "href">) {
  const { open } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        "group relative flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-all duration-150",
        active
          ? "bg-[#f0b429]/10 text-[#f0b429]"
          : "text-gray-400 hover:bg-[#1e2a3a] hover:text-gray-100",
        className
      )}
      {...props}
    >
      {active && (
        <span className="left-0 absolute inset-y-0 bg-[#f0b429] rounded-full w-0.5" />
      )}
      <span className={cn("flex justify-center items-center w-5 h-5 shrink-0", active ? "text-[#f0b429]" : "text-gray-500 group-hover:text-gray-300")}>
        {link.icon}
      </span>
      <span
        className={cn(
          "font-medium text-sm whitespace-nowrap transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0 hidden md:inline-block pointer-events-none"
        )}
      >
        {link.label}
      </span>
    </Link>
  );
}