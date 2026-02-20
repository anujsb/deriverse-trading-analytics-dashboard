import type { ReactNode } from "react";
import { DeriverseSidebar } from "@/components/deriverse-sidebar";
import AiTradingSummary from "@/components/AiTradingSummary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-[#080d13] h-screen overflow-hidden">
      {/* <DeriverseSidebar /> */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <AiTradingSummary />
      </div>
    </div>
  );
}

