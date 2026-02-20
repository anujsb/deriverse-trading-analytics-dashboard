"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface Trade {
    signature: string;
    userId: string;
    timestamp: string;
    type: string;
    symbol: string;
    status: string;
    entryPrice: string;
    exitPrice: string | null;
    entryTimestamp: string | null;
    size: string;
    fee: string;
    pnl: string | null;
    leverage: string | null;
    orderType: string | null;
    feeType: string | null;
    createdAt: string;
}

interface PerformanceSnapshot {
    id: string;
    userId: string;
    date: string;
    totalPnl: string;
    totalVolume: string;
    totalFees: string;
    tradeCount: string;
    winCount: string;
    lossCount: string;
}

interface ApiResponse {
    trades: Trade[];
    total: number;
    limit: number;
    offset: number;
}

interface Props {
    symbol?: string;
    startDate?: string;
    endDate?: string;
}


function computeStats(trades: Trade[]) {
    const closed = trades.filter((t) => t.status === "CLOSED" && t.pnl !== null);
    const open = trades.filter((t) => t.status === "OPEN");

    const totalPnl = closed.reduce((s, t) => s + parseFloat(t.pnl!), 0);
    const totalFees = trades.reduce((s, t) => s + parseFloat(t.fee), 0);
    const totalVolume = trades.reduce((s, t) => s + parseFloat(t.entryPrice) * parseFloat(t.size), 0);

    const winners = closed.filter((t) => parseFloat(t.pnl!) > 0);
    const losers = closed.filter((t) => parseFloat(t.pnl!) <= 0);
    const winRate = closed.length ? ((winners.length / closed.length) * 100).toFixed(1) : "0.0";
    const avgWin = winners.length ? winners.reduce((s, t) => s + parseFloat(t.pnl!), 0) / winners.length : 0;
    const avgLoss = losers.length ? losers.reduce((s, t) => s + parseFloat(t.pnl!), 0) / losers.length : 0;
    const biggestWin = winners.length ? Math.max(...winners.map((t) => parseFloat(t.pnl!))) : 0;
    const biggestLoss = losers.length ? Math.min(...losers.map((t) => parseFloat(t.pnl!))) : 0;
    const openExposure = open.reduce((s, t) => s + parseFloat(t.entryPrice) * parseFloat(t.size), 0);

    const symbolMap: Record<string, { count: number; pnl: number }> = {};
    closed.forEach((t) => {
        if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { count: 0, pnl: 0 };
        symbolMap[t.symbol].count++;
        symbolMap[t.symbol].pnl += parseFloat(t.pnl!);
    });

    const symbols = [...new Set(trades.map((t) => t.symbol))];
    const types = [...new Set(trades.map((t) => t.type))];
    const longCount = trades.filter((t) => t.type === "LONG").length;
    const shortCount = trades.filter((t) => t.type === "SHORT").length;
    const grossPnl = winners.reduce((s, t) => s + parseFloat(t.pnl!), 0);
    const feePct = grossPnl > 0 ? ((totalFees / grossPnl) * 100).toFixed(1) : "N/A";

    const dailyMap: Record<string, number> = {};
    closed.forEach((t) => {
        const day = t.timestamp.slice(0, 10);
        dailyMap[day] = (dailyMap[day] || 0) + parseFloat(t.pnl!);
    });
    const dailyPnl = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

    return {
        closed, open,
        totalPnl, totalFees, totalVolume,
        winners, losers,
        winRate, avgWin, avgLoss,
        biggestWin, biggestLoss,
        openExposure,
        symbols, types, symbolMap,
        longCount, shortCount,
        feePct, dailyPnl,
    };
}



export default function AiTradingSummary({
    symbol,
    startDate,
    endDate,
}: Props) {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
    const { publicKey, connected, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const userId = publicKey?.toString() ?? null;

    const [trades, setTrades] = useState<Trade[]>([]);
    const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
    const [total, setTotal] = useState(0);
    const [loadingDB, setLoadingDB] = useState(false);
    const [dbError, setDbError] = useState("");

    const [summary, setSummary] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [aiError, setAiError] = useState("");
    const [generatedAt, setGeneratedAt] = useState("");

    useEffect(() => {
        if (!userId) {
            setTrades([]);
            setSnapshots([]);
            setTotal(0);
            setDbError("");
            setSummary(null);
            return;
        }

        async function load() {
            setLoadingDB(true);
            setDbError("");
            try {
                const params = new URLSearchParams({ userId: userId!, limit: "500", offset: "0" });
                if (symbol) params.set("symbol", symbol);
                if (startDate) params.set("startDate", startDate);
                if (endDate) params.set("endDate", endDate);

                const [tradesRes, snapshotsRes] = await Promise.all([
                    fetch(`/api/trades?${params.toString()}`),
                    fetch(`/api/performance-snapshots?userId=${encodeURIComponent(userId!)}`),
                ]);

                if (!tradesRes.ok) {
                    const e = await tradesRes.json();
                    throw new Error(e.error || `HTTP ${tradesRes.status}`);
                }
                const tradesData: ApiResponse = await tradesRes.json();
                setTrades(tradesData.trades ?? []);
                setTotal(tradesData.total ?? 0);

                if (snapshotsRes.ok) {
                    const snapsData = await snapshotsRes.json();
                    setSnapshots(snapsData.snapshots ?? []);
                }
            } catch (e: any) {
                setDbError(e.message || "Failed to load trades");
            } finally {
                setLoadingDB(false);
            }
        }

        load();
    }, [userId, symbol, startDate, endDate]);

    async function generateSummary() {
        if (!GEMINI_API_KEY) { setAiError("NEXT_PUBLIC_GEMINI_API_KEY is not set in your .env.local"); return; }
        if (!trades.length) { setAiError("No trades loaded to analyze."); return; }

        setLoadingAI(true);
        setAiError("");
        setSummary(null);

        const s = computeStats(trades);

        const prompt = `You are a professional crypto trading analyst for Deriverse (Solana on-chain DEX). Analyze the data and respond with EXACTLY these 4 bold-header markdown sections:

**Performance Summary**
(3-4 sentences: overall P&L, win rate context, fee impact, what the numbers reveal about this trader's edge)

**Key Patterns**
- (pattern about entry price clustering or timing)
- (pattern about position sizing or exposure concentration)
- (pattern about fee drag relative to avg win size)

**Strategy Improvements**
- (specific data-backed improvement #1)
- (specific data-backed improvement #2)
- (specific data-backed improvement #3)

**Risk Assessment**
(1-2 sentences: current open exposure risk and what to watch immediately)

--- TRADER DATA ---
Wallet: ${userId}
Total in DB: ${total} | Loaded: ${trades.length}
Closed: ${s.closed.length} | Open: ${s.open.length}
Symbols: ${s.symbols.join(", ")}
Types: ${s.types.join(", ")} | Long: ${s.longCount} | Short: ${s.shortCount}

Realized PnL: ${s.totalPnl.toFixed(6)} USDC
Win rate: ${s.winRate}% (${s.winners.length}W / ${s.losers.length}L)
Best trade: +${s.biggestWin.toFixed(6)} USDC
Worst trade: ${s.biggestLoss.toFixed(6)} USDC
Avg win: +${s.avgWin.toFixed(6)} USDC | Avg loss: ${s.avgLoss.toFixed(6)} USDC
Win/Loss ratio: ${s.avgLoss !== 0 ? Math.abs(s.avgWin / s.avgLoss).toFixed(2) : "N/A"}
Total fees: ${s.totalFees.toFixed(6)} USDC (${s.feePct}% of gross wins)
Total volume: $${s.totalVolume.toFixed(2)} | Open exposure: $${s.openExposure.toFixed(2)}

Daily PnL: ${s.dailyPnl.map(([d, p]) => `${d}: ${p >= 0 ? "+" : ""}${p.toFixed(4)}`).join(" | ")}

Symbol breakdown:
${Object.entries(s.symbolMap).map(([sym, d]) => `  ${sym}: ${d.count} trades, PnL ${d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(5)} USDC`).join("\n")}

Date range: ${trades[trades.length - 1]?.timestamp?.slice(0, 10)} → ${trades[0]?.timestamp?.slice(0, 10)}

Be specific and data-driven. Reference actual numbers.`;

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.6, maxOutputTokens: 1000 },
                    }),
                }
            );
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.error?.message || "Gemini API error");
            }
            const data = await res.json();
            setSummary(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated.");
            setGeneratedAt(new Date().toLocaleTimeString());
        } catch (e: any) {
            setAiError(e.message);
        } finally {
            setLoadingAI(false);
        }
    }

    function renderMd(text: string) {
        return text.split("\n").map((line, i) => {
            if (/^\*\*(.+)\*\*$/.test(line))
                return (
                    <h3 key={i} style={{ color: "#e2c97e", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", margin: "20px 0 8px", borderBottom: "1px solid #1a1b1c", paddingBottom: 6 }}>
                        {line.replace(/\*\*/g, "")}
                    </h3>
                );
            if (line.startsWith("- "))
                return (
                    <div key={i} style={{ display: "flex", gap: 8, margin: "5px 0", alignItems: "flex-start" }}>
                        <span style={{ color: "#e2c97e", flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
                        <span style={{ color: "#b0a898", fontSize: 13, lineHeight: 1.65 }}
                            dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0ebe0">$1</strong>') }}
                        />
                    </div>
                );
            if (line.trim() === "") return <div key={i} style={{ height: 5 }} />;
            return (
                <p key={i} style={{ color: "#b0a898", fontSize: 13, lineHeight: 1.7, margin: "4px 0" }}
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0ebe0">$1</strong>') }}
                />
            );
        });
    }

    const stats = computeStats(trades);
    const pnlColor = stats.totalPnl >= 0 ? "#4ade80" : "#f87171";
    const maxAbs = stats.closed.length
        ? Math.max(...stats.closed.map((t) => Math.abs(parseFloat(t.pnl!))))
        : 1;

    const statCards = [
        { label: "Realized PnL", val: `${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(5)}`, sub: "USDC", c: pnlColor },
        { label: "Win Rate", val: `${stats.winRate}%`, sub: `${stats.winners.length}W / ${stats.losers.length}L`, c: parseFloat(stats.winRate) >= 50 ? "#4ade80" : "#f87171" },
        { label: "Fees Paid", val: stats.totalFees.toFixed(5), sub: `${stats.feePct}% of gross wins`, c: "#f87171" },
        { label: "Open Exposure", val: `$${stats.openExposure.toFixed(2)}`, sub: `${stats.open.length} positions`, c: "#e2c97e" },
        { label: "Best Trade", val: `+${stats.biggestWin.toFixed(5)}`, sub: "USDC", c: "#4ade80" },
        { label: "Worst Trade", val: stats.biggestLoss.toFixed(5), sub: "USDC", c: "#f87171" },
        { label: "Avg Win", val: `+${stats.avgWin.toFixed(5)}`, sub: "USDC", c: "#4ade80" },
        { label: "Avg Loss", val: stats.avgLoss.toFixed(5), sub: "USDC", c: "#f87171" },
        { label: "Total Volume", val: `$${stats.totalVolume.toFixed(2)}`, sub: `${trades.length} trades`, c: "#a0a8b8" },
        { label: "Long / Short", val: `${stats.longCount} / ${stats.shortCount}`, sub: "direction split", c: "#a0a8b8" },
    ];

    return (
        <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#0c0d0e", minHeight: "100vh", padding: 24, color: "#f0ebe0" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Cormorant+Garamond:wght@500;600&display=swap');
        *{box-sizing:border-box}
        .card{background:#111213;border:1px solid #1e2022;border-radius:6px;padding:16px;transition:border-color 0.2s}
        .card:hover{border-color:#e2c97e22}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px}
        .btn{background:#e2c97e;color:#0c0d0e;border:none;padding:10px 22px;border-radius:4px;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer;letter-spacing:0.1em;text-transform:uppercase;transition:opacity 0.15s;display:inline-flex;align-items:center;gap:7px}
        .btn:hover{opacity:0.85}.btn:disabled{opacity:0.35;cursor:not-allowed}
        .btn-outline{background:none;border:1px solid #e2c97e55;color:#e2c97e;border-radius:4px;padding:10px 22px;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer;letter-spacing:0.1em;text-transform:uppercase;transition:all 0.15s;display:inline-flex;align-items:center;gap:7px}
        .btn-outline:hover{background:#e2c97e11}
        .inp{background:#0c0d0e;border:1px solid #1e2022;border-radius:4px;padding:9px 13px;color:#f0ebe0;font-family:inherit;font-size:11px;width:100%;outline:none;transition:border-color 0.2s}
        .inp:focus{border-color:#e2c97e55}
        .ghost{background:none;border:1px solid #1e2022;border-radius:3px;padding:5px 11px;color:#555;font-size:10px;cursor:pointer;font-family:inherit;letter-spacing:0.08em;transition:border-color 0.15s,color 0.15s}
        .ghost:hover{border-color:#e2c97e44;color:#888}.ghost:disabled{opacity:0.3;cursor:not-allowed}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pulse{animation:pulse 1.4s ease-in-out infinite}
        .fade-up{animation:fadeUp 0.3s ease}
        .spinner{width:14px;height:14px;border:2px solid #1e2022;border-top-color:#e2c97e;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
      `}</style>

            <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #181a1c", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
                <div>
                    <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5 }}>
                        Deriverse · AI Analytics
                    </div>
                    <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, margin: 0, color: "#f0ebe0" }}>
                        Portfolio Summary
                    </h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, letterSpacing: "0.1em" }}>
                    {connecting ? (
                        <><div className="spinner" /><span style={{ color: "#555" }}>CONNECTING…</span></>
                    ) : connected && userId ? (
                        <>
                            <span style={{ color: "#4ade80" }}>●</span>
                            <span style={{ color: "#444", fontFamily: "monospace" }}>
                                {userId.slice(0, 4)}…{userId.slice(-4)}
                            </span>
                            {loadingDB
                                ? <><div className="spinner" /><span style={{ color: "#555" }}>LOADING</span></>
                                : <span style={{ color: "#333" }}>{trades.length} / {total} TRADES</span>
                            }
                        </>
                    ) : (
                        <span style={{ color: "#555" }}>● NOT CONNECTED</span>
                    )}
                </div>
            </div>


            {!connecting && !connected && (
                <div className="card fade-up" style={{ textAlign: "center", padding: "52px 24px" }}>
                    <div style={{ fontSize: 28, marginBottom: 12, color: "#252729" }}>◈</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#555", marginBottom: 6 }}>
                        Wallet not connected
                    </div>
                    <div style={{ fontSize: 11, color: "#333", letterSpacing: "0.08em", marginBottom: 20 }}>
                        Connect your Solana wallet to load your trade data
                    </div>
                    <button className="btn-outline" onClick={() => setVisible(true)}>
                        Connect Wallet
                    </button>
                </div>
            )}

            {connected && dbError && (
                <div className="fade-up card" style={{ borderColor: "#f8717133", background: "#140e0f", marginBottom: 14, fontSize: 12, color: "#f87171" }}>
                    ⚠ {dbError} — make sure you've synced your trades first.
                </div>
            )}

            {connected && loadingDB && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "52px 0", color: "#333" }}>
                    <div className="spinner" />
                    <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        Fetching trades from Neon DB…
                    </span>
                </div>
            )}

            {connected && !loadingDB && !dbError && trades.length > 0 && (
                <>
                    <div className="stat-grid">
                        {statCards.map((s, i) => (
                            <div className="card" key={i}>
                                <div style={{ fontSize: 9, color: "#3a3c40", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 9 }}>{s.label}</div>
                                <div style={{ fontSize: 14, color: s.c, fontWeight: 500, marginBottom: 2 }}>{s.val}</div>
                                <div style={{ fontSize: 9, color: "#2e3033", letterSpacing: "0.06em" }}>{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {stats.closed.length > 0 && (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div style={{ fontSize: 9, color: "#3a3c40", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                    Closed Trade PnL · {stats.closed.length} trades
                                </div>
                                <div style={{ display: "flex", gap: 12, fontSize: 9, color: "#333" }}>
                                    <span>■ <span style={{ color: "#4ade8066" }}>win</span></span>
                                    <span>■ <span style={{ color: "#f8717166" }}>loss</span></span>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 52 }}>
                                {stats.closed.map((t, i) => {
                                    const p = parseFloat(t.pnl!);
                                    const h = Math.max(3, (Math.abs(p) / maxAbs) * 52);
                                    return (
                                        <div
                                            key={i}
                                            title={`${t.symbol} · ${t.timestamp?.slice(0, 16)} · ${p >= 0 ? "+" : ""}${p.toFixed(6)} USDC`}
                                            style={{ flex: 1, minWidth: 3, height: h, background: p >= 0 ? "#4ade8033" : "#f8717133", border: `1px solid ${p >= 0 ? "#4ade8066" : "#f8717166"}`, borderRadius: 2 }}
                                        />
                                    );
                                })}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#252729", marginTop: 6 }}>
                                <span>{stats.closed[stats.closed.length - 1]?.timestamp?.slice(0, 10)}</span>
                                <span>{stats.closed[0]?.timestamp?.slice(0, 10)}</span>
                            </div>
                        </div>
                    )}

                    {stats.dailyPnl.length > 0 && (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 9, color: "#3a3c40", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Daily PnL</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {stats.dailyPnl.map(([day, pnl]) => (
                                    <div key={day} style={{ background: pnl >= 0 ? "#0f1f14" : "#1a0f0f", border: `1px solid ${pnl >= 0 ? "#4ade8033" : "#f8717133"}`, borderRadius: 4, padding: "6px 10px", textAlign: "center" }}>
                                        <div style={{ fontSize: 8, color: "#444", marginBottom: 3, letterSpacing: "0.08em" }}>{day.slice(5)}</div>
                                        <div style={{ fontSize: 12, color: pnl >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>
                                            {pnl >= 0 ? "+" : ""}{pnl.toFixed(4)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {snapshots.length > 0 && (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 9, color: "#3a3c40", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                                Performance Snapshots · {snapshots.length} days
                            </div>
                            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 36 }}>
                                {snapshots.slice(-30).map((snap, i) => {
                                    const p = parseFloat(snap.totalPnl);
                                    const maxP = Math.max(...snapshots.map((s) => Math.abs(parseFloat(s.totalPnl)))) || 1;
                                    const h = Math.max(3, (Math.abs(p) / maxP) * 36);
                                    return (
                                        <div
                                            key={i}
                                            title={`${snap.date?.slice(0, 10)} · PnL: ${p.toFixed(4)} · Trades: ${snap.tradeCount}`}
                                            style={{ flex: 1, minWidth: 3, height: h, background: p >= 0 ? "#4ade8022" : "#f8717122", border: `1px solid ${p >= 0 ? "#4ade8044" : "#f8717144"}`, borderRadius: 2 }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {connected && !loadingDB && !dbError && trades.length === 0 && (
                <div style={{ textAlign: "center", padding: "52px 0", color: "#252729", fontSize: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>◈</div>
                    <div style={{ marginBottom: 4 }}>No trades found for this wallet.</div>
                    <div style={{ fontSize: 10, color: "#1e2022", letterSpacing: "0.08em" }}>
                        Sync your trades first using the sync button in the dashboard.
                    </div>
                </div>
            )}

            {connected && !loadingDB && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 9, color: "#3a3c40", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>AI Analysis</div>
                            <div style={{ fontSize: 12, color: "#3a3c40" }}>
                                Gemini 2.0 Flash · {userId ? `${userId.slice(0, 4)}…${userId.slice(-4)}` : "—"}
                            </div>
                        </div>
                    </div>

                    <button className="btn" onClick={generateSummary} disabled={loadingAI || trades.length === 0}>
                        {loadingAI
                            ? <><span className="pulse" style={{ fontSize: 14 }}>◈</span>Analyzing…</>
                            : <><span style={{ fontSize: 14 }}>◈</span>Generate Summary</>
                        }
                    </button>

                    {aiError && (
                        <div className="fade-up" style={{ marginTop: 14, background: "#140e0f", border: "1px solid #f8717133", borderRadius: 4, padding: "11px 14px", fontSize: 12, color: "#f87171" }}>
                            ⚠ {aiError}
                        </div>
                    )}

                    {!summary && !loadingAI && !aiError && (
                        <div style={{ textAlign: "center", padding: "36px 0 16px", color: "#1e2022" }}>
                            <div style={{ fontSize: 28, marginBottom: 10 }}>◈</div>
                            <div style={{ fontSize: 11, letterSpacing: "0.08em", lineHeight: 1.9 }}>
                                {trades.length === 0
                                    ? "No trade data to analyze."
                                    : "Enter your Gemini key and click Generate."}
                            </div>
                        </div>
                    )}

                    {loadingAI && (
                        <div className="fade-up" style={{ textAlign: "center", padding: "32px 0 16px" }}>
                            <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.16em" }}>
                                <span className="pulse">
                                    PROCESSING {stats.closed.length} CLOSED · {stats.open.length} OPEN · {trades.length} TOTAL
                                </span>
                            </div>
                        </div>
                    )}

                    {summary && (
                        <div className="fade-up" style={{ borderTop: "1px solid #181a1c", marginTop: 16, paddingTop: 16 }}>
                            {renderMd(summary)}
                            <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #131415", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 9, color: "#1e2022", letterSpacing: "0.1em" }}>
                                    GEMINI 2.0 FLASH · {generatedAt}
                                </span>
                                <button className="ghost" onClick={generateSummary} disabled={loadingAI}>↻ Refresh</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginTop: 14, textAlign: "center", fontSize: 9, color: "#181a1c", letterSpacing: "0.14em" }}>
                DERIVERSE · NEON DB · GEMINI AI
            </div>
        </div>
    );
}