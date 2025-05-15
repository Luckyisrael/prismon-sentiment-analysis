import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleDollarSign } from 'lucide-react';
import { motion } from '@/components/motion';
import { LoginModal } from '@/components/login-modal';
import { SignupModal } from '@/components/signup-modal';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


export function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">Solana Sentiment</span>
          </div>
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowLoginModal(true)}
              className="text-base"
            >
              Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSignupModal(true)}
              className="text-base px-6"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <motion.div 
            className="space-y-8 text-center md:text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Track Solana Sentiment in Real-Time
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Connect your wallet to analyze market sentiment and make informed decisions for your Solana investments.
            </p>

            <div className="flex justify-start p-4">
              <WalletMultiButton
                className="bpx-8 py-6 text-lg h-auto"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border backdrop-blur-sm">
              <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center mb-8">
                <CircleDollarSign className="h-32 w-32 text-primary opacity-10" />
               
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold tracking-tight">Powerful Sentiment Analysis</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Our advanced AI analyzes social media, news, and market data to provide accurate Solana sentiment scores in real-time.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Solana Sentiment Tracker. All rights reserved.
          </div>
        </div>
      </footer>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      <SignupModal open={showSignupModal} onOpenChange={setShowSignupModal} />
    </div>
  );
}