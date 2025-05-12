import { useState, useEffect } from 'react';
import { LandingPage } from '@/pages/landing-page';
import { Dashboard } from '@/pages/dashboard';
import { LoadingScreen } from '@/components/loading-screen';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/auth-context';

export function Routes() {
  const { connected } = useWallet();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status here if needed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <Dashboard />;
}