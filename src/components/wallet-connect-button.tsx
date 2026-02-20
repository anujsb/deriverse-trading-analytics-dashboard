'use client';

import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  async () => {
    const mod = await import('@solana/wallet-adapter-react-ui');
    return mod.WalletMultiButton;
  },
  { ssr: false }
);

export function WalletConnectButton() {
  const { publicKey, connected } = useWallet();

  return (
    <>
      <style>{`
        /* Override Solana wallet adapter button to match Deriverse */
        .wallet-adapter-button {
          font-family: 'DM Mono', 'Courier New', monospace !important;
          font-size: 10px !important;
          font-weight: 500 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          background: none !important;
          border: 1px solid rgba(226,201,126,0.35) !important;
          color: #e2c97e !important;
          border-radius: 4px !important;
          padding: 7px 14px !important;
          height: 30px !important;
          line-height: 1 !important;
          transition: background 0.15s, border-color 0.15s !important;
        }
        .wallet-adapter-button:hover:not(:disabled) {
          background: rgba(226,201,126,0.07) !important;
          border-color: rgba(226,201,126,0.6) !important;
        }
        .wallet-adapter-button:disabled {
          opacity: 0.35 !important;
          cursor: not-allowed !important;
        }
        .wallet-adapter-button-start-icon {
          display: none !important;
        }
        .wallet-adapter-modal-wrapper {
          font-family: 'DM Mono', monospace !important;
          background: #111213 !important;
          border: 1px solid #1e2022 !important;
          border-radius: 8px !important;
        }
        .wallet-adapter-modal-title {
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 20px !important;
          color: #f0ebe0 !important;
        }
        .wallet-adapter-modal-list li button {
          font-family: 'DM Mono', monospace !important;
          font-size: 11px !important;
          color: #b0a898 !important;
        }
        .wallet-adapter-modal-list li button:hover {
          background: rgba(226,201,126,0.07) !important;
          color: #e2c97e !important;
        }
        .wallet-adapter-modal-overlay {
          background: rgba(12,13,14,0.8) !important;
          backdrop-filter: blur(4px) !important;
        }
      `}</style>
      <WalletMultiButton />
    </>
  );
}