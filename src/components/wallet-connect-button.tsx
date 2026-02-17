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
    <div className="flex items-center gap-4">
      <WalletMultiButton />
      {connected && publicKey && (
        <div className="text-sm">
          Connected: {publicKey.toBase58().slice(0, 4)}...
          {publicKey.toBase58().slice(-4)}
        </div>
      )}
    </div>
  );
}
