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
        "hidden md:flex md:flex-col min-h-screen h-full border-r bg-white shadow-sm transition-[width] duration-200 ease-out",
        open ? "w-[280px]" : "w-[64px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label="Sidebar"
    >
      <div className="h-full px-3 py-4 flex flex-col gap-4">{children}</div>
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
      <div className="h-14 px-4 flex items-center justify-between border-b bg-white/80 backdrop-blur">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold text-gray-900">
          Deriverse Analytics
        </div>
        <div className="w-9" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-xl p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Menu</div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
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
  ...props
}: {
  link: SidebarLinkItem;
  className?: string;
} & Omit<LinkProps, "href">) {
  const { open } = useSidebar();

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <span className="h-5 w-5 flex items-center justify-center text-gray-700">
        {link.icon}
      </span>
      <span
        className={cn(
          "whitespace-nowrap transition-opacity",
          open ? "opacity-100" : "opacity-0 hidden md:inline-block"
        )}
      >
        {link.label}
      </span>
    </Link>
  );
}

