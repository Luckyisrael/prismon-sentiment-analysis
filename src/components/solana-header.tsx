import { CircleDollarSign, Coins } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { useWallet } from '@solana/wallet-adapter-react';

export function SolanaHeader() {
  const { publicKey,  } = useWallet();
const walletAddress = publicKey?.toBase58()
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl tracking-tight">Solana Sentiment</span>
        </div>
        <div className="flex items-center space-x-6">
          {walletAddress && (
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-base text-muted-foreground">
                <Coins className="h-5 w-5" />
                {/**<span>{walletBalance !== null ? `${walletBalance.toFixed(2)} SOL` : '...'}</span> */}
              </div>
              <span className="font-mono">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}