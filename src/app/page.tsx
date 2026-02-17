import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative flex flex-col justify-center items-center bg-[#080d13] px-6 min-h-screen overflow-hidden">


      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#f0b429 1px, transparent 1px), linear-gradient(90deg, #f0b429 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />


      <div className="top-1/2 left-1/2 absolute bg-[#f0b429] opacity-[0.04] blur-[120px] rounded-full w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />


      <div className="top-0 right-0 left-0 absolute flex justify-between items-center px-8 py-5 border-[#1e2a3a] border-b">
        <span className="font-mono font-bold text-[11px] text-gray-500 uppercase tracking-[0.2em]">
          Deriverse Analytics
        </span>
        <div className="flex items-center gap-5">
          <a
            href="https://x.com/anujsbhuyar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-semibold text-[10px] text-gray-300 hover:text-[#f0b429] uppercase tracking-widest transition-colors"
          >
            Twitter
          </a>
          <a
            href="https://github.com/anujsb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-semibold text-[10px] text-gray-300 hover:text-[#f0b429] uppercase tracking-widest transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/anujbhuyar/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-semibold text-[10px] text-gray-300 hover:text-[#f0b429] uppercase tracking-widest transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://anuj-bhuyar-ten.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-semibold text-[10px] text-gray-300 hover:text-[#f0b429] uppercase tracking-widest transition-colors"
          >
            Portfolio
          </a>
        </div>
      </div>


      <div className="z-10 relative flex flex-col items-center max-w-2xl text-center">


        <div className="inline-flex items-center gap-2 bg-[#f0b429]/5 mb-8 px-4 py-1.5 border border-[#f0b429]/20 rounded-full">
          <span className="bg-[#f0b429] rounded-full w-1.5 h-1.5 animate-pulse" />
          <span className="font-mono font-semibold text-[#f0b429] text-[10px] uppercase tracking-[0.2em]">
            Deriverse Bounty Submission
          </span>
        </div>


        <h1 className="mb-6 font-black text-white text-5xl sm:text-6xl leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Know your trades.<br />
          <span className="text-[#f0b429]">Actually.</span>
        </h1>


        <p className="mb-4 max-w-lg text-gray-500 text-base leading-relaxed">
          A full analytics dashboard built for Deriverse perpetual traders —
          connect your Solana wallet and instantly see what's working, what's not,
          and where your fees are going.
        </p>


        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            'PnL & Drawdown',
            'Win Rate',
            'Fee Breakdown',
            'Time-of-day Analysis',
            'Trade Journal',
            'Long/Short Ratio',
            'Order Type Stats',
            'Symbol Filters',
          ].map((f) => (
            <span
              key={f}
              className="bg-[#0d1117] px-3 py-1.5 border border-[#1e2a3a] rounded-full font-mono text-[10px] text-gray-500 tracking-wide"
            >
              {f}
            </span>
          ))}
        </div>


        <Link
          href="/dashboard"
          className="group inline-flex relative items-center gap-3 bg-[#f0b429] hover:bg-[#d4a017] shadow-[0_0_32px_rgba(240,180,41,0.2)] hover:shadow-[0_0_48px_rgba(240,180,41,0.35)] px-8 py-4 rounded-xl font-black text-[#080d13] text-sm tracking-wide transition-all duration-150"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Open Dashboard
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        <p className="mt-4 font-mono text-[10px] text-gray-700">
          No data stored. Reads on-chain state directly from your wallet.
        </p>
      </div>


      <div className="right-0 bottom-0 left-0 absolute flex justify-between items-center px-8 py-4 border-[#1e2a3a] border-t">
        <span className="font-mono text-[10px] text-gray-700">
          built by{' '}
          <a
            href="https://anuj-bhuyar-ten.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-[#f0b429] transition-colors"
          >
            Anuj Bhuyar
          </a>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-gray-700">Powered by</span>
          <span className="font-mono font-bold text-[10px] text-gray-500">Solana</span>
          <span className="font-mono text-[10px] text-gray-700">×</span>
          <span className="font-mono font-bold text-[#f0b429] text-[10px]">Deriverse</span>
        </div>
      </div>

    </main>
  );
}