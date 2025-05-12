import { useWallet } from '@/context/wallet-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Wallet } from 'lucide-react';
import { SolanaHeader } from '@/components/solana-header';
import { motion } from '@/components/motion';

export function WalletRegistration() {
  const { walletAddress, registerWallet, isRegistering, disconnectWallet } = useWallet();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SolanaHeader />
      
      <main className="flex-1 container flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Wallet Not Registered</CardTitle>
              <CardDescription>
                Your wallet needs to be registered before accessing the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-muted-foreground" />
                <div className="text-sm">
                  <span className="text-muted-foreground mr-2">Connected Wallet:</span>
                  <span className="font-mono">
                    {walletAddress && `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                By registering your wallet, you'll be able to access all features of the Solana Sentiment Tracker, including real-time price tracking and sentiment analysis.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={registerWallet}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <span className="mr-2">Registering...</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-background" />
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Register Wallet
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={disconnectWallet}
                disabled={isRegistering}
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Solana Sentiment Tracker. All rights reserved.
        </div>
      </footer>
    </div>
  );
}