"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Clock, Brain } from "lucide-react";
import Image from "next/image";

const nav = [
  { label: "Overview",       href: "/dashboard",            icon: LayoutDashboard, desc: "PnL & performance" },
  { label: "Trades & Fees",  href: "/dashboard/trades",     icon: History,         desc: "History & fee breakdown" },
  { label: "Analytics",      href: "/dashboard/analytics",  icon: Clock,           desc: "Time & session stats" },
  { label: "AI Summary",     href: "/dashboard/aisummary",         icon: Brain,           desc: "Gemini analysis" },
] as const;

export function DeriverseSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@500;600&display=swap');
        .dv-sidebar {
          display: flex; flex-direction: column;
          background: #0e0f10;
          border-right: 1px solid #181a1c;
          height: 100vh; position: sticky; top: 0;
          font-family: 'DM Mono', 'Courier New', monospace;
          transition: width 0.2s ease;
          overflow: hidden; flex-shrink: 0;
          z-index: 20;
        }
        .dv-sidebar.expanded { width: 200px; }
        .dv-sidebar.collapsed { width: 52px; }

        .dv-sidebar-top { padding: 16px 14px 12px; border-bottom: 1px solid #181a1c; display: flex; align-items: center; gap: 10px; justify-content: space-between; }
        .dv-logo-mark { font-size: 16px; color: #e2c97e; flex-shrink: 0; line-height: 1; width: 24px; text-align: center; }
        .dv-logo-text { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; color: #f0ebe0; white-space: nowrap; overflow: hidden; transition: opacity 0.15s, width 0.2s; }
        .dv-sidebar.expanded  .dv-logo-text { opacity: 1; width: auto; }
        .dv-sidebar.collapsed .dv-logo-text { opacity: 0; width: 0; }

        .dv-collapse-btn { background: none; border: none; cursor: pointer; padding: 3px; color: #2e3033; transition: color 0.15s; flex-shrink: 0; display: flex; align-items: center; }
        .dv-collapse-btn:hover { color: #888; }

        .dv-nav { display: flex; flex-direction: column; gap: 2px; padding: 10px 8px; flex: 1; }
        .dv-nav-section { font-size: 8px; color: #1e2022; letter-spacing: 0.18em; text-transform: uppercase; padding: 0 6px; margin: 8px 0 4px; white-space: nowrap; overflow: hidden; transition: opacity 0.15s; }
        .dv-sidebar.collapsed .dv-nav-section { opacity: 0; }

        .dv-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 8px; border-radius: 4px;
          text-decoration: none; color: #3a3c40;
          font-size: 11px; letter-spacing: 0.04em;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .dv-nav-item:hover { color: #b0a898; background: rgba(255,255,255,0.025); }
        .dv-nav-item.active { color: #e2c97e; background: rgba(226,201,126,0.07); }
        .dv-nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 4px; bottom: 4px;
          width: 2px; background: #e2c97e; border-radius: 0 2px 2px 0;
        }
        .dv-nav-icon { flex-shrink: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; }
        .dv-nav-label { overflow: hidden; transition: opacity 0.15s, width 0.2s; }
        .dv-sidebar.expanded  .dv-nav-label { opacity: 1; width: auto; }
        .dv-sidebar.collapsed .dv-nav-label { opacity: 0; width: 0; }

        .dv-sidebar-footer { padding: 12px 12px 16px; border-top: 1px solid #181a1c; }
        .dv-footer-inner { background: rgba(226,201,126,0.04); border: 1px solid rgba(226,201,126,0.1); border-radius: 4px; padding: 9px 11px; overflow: hidden; transition: opacity 0.15s; }
        .dv-sidebar.collapsed .dv-footer-inner { opacity: 0; }
        .dv-footer-text { font-size: 9px; color: #2e3033; line-height: 1.7; letter-spacing: 0.04em; }
        .dv-footer-mark { margin-top: 10px; font-size: 8px; color: #181a1c; letter-spacing: 0.14em; text-align: center; }

        /* Tooltip for collapsed state */
        .dv-nav-item .dv-tooltip {
          display: none; position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%); background: #111213; border: 1px solid #1e2022;
          border-radius: 4px; padding: 5px 10px; font-size: 10px; color: #b0a898;
          white-space: nowrap; pointer-events: none; z-index: 30;
        }
        .dv-sidebar.collapsed .dv-nav-item:hover .dv-tooltip { display: block; }
      `}</style>

      <aside className={`dv-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        {/* Logo row */}
        <div className="dv-sidebar-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
            <span className="dv-logo-mark">◈</span>
            <span className="dv-logo-text">Deriverse</span>
          </div>
          <button className="dv-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {collapsed
                ? <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="dv-nav">
          <div className="dv-nav-section">Navigation</div>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`dv-nav-item${active ? ' active' : ''}`}>
                <span className="dv-nav-icon">
                  <Icon size={14} />
                </span>
                <span className="dv-nav-label">{item.label}</span>
                <span className="dv-tooltip">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="dv-sidebar-footer">
          <div className="dv-footer-inner">
            <div className="dv-footer-text">
              On-chain Solana<br /> analytics
            </div>
          </div>
          <div className="dv-footer-mark">DERIVERSE</div>
        </div>
      </aside>
    </>
  );
}