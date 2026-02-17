import type { ReactNode } from "react";
import { DeriverseSidebar } from "@/components/deriverse-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <DeriverseSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

