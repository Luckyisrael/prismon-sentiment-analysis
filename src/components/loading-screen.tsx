import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h2 className="text-2xl font-semibold text-primary">Loading Solana Sentiment Tracker</h2>
    </div>
  );
}