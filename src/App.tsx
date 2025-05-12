import { ThemeProvider } from "@/components/theme-provider";
import { Routes } from "@/components/routes";
import { Toaster } from "@/components/ui/toaster";
import { WalletContextProvider } from "@/context/wallet-context";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/auth-context";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="solana-theme">
      <WalletContextProvider>
        <AuthProvider>
          <Router>
            <Routes />
          </Router>
        </AuthProvider>
        <Toaster />
      </WalletContextProvider>
    </ThemeProvider>
  );
}

export default App;
