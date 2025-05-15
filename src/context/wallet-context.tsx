import React, { createContext, useContext, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Define the shape of the WalletContext
interface WalletContextType {
  // Add any additional context values here if needed
}

// Create the WalletContext
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Custom hook to access the WalletContext
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  return context;
};

// WalletContextProvider component to wrap the app
export const WalletContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Solana network (Devnet for testing)
  const network = clusterApiUrl('devnet');

  // Initialize wallets (Phantom, Solflare, etc.)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Add more wallet adapters as needed
    ],
    []
  );

  // Context value (can be extended with additional wallet-related data)
  const contextValue = useMemo(() => ({}), []);

  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletContext.Provider value={contextValue}>
            {/* Render the WalletMultiButton for connecting/disconnecting */}
           
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
