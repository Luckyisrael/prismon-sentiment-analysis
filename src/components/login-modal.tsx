import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { client } from '@/lib/utils';
import { LoadingScreen } from '@/components/loading-screen'; // Adjust the import path as needed
import { useAuth } from '@/context/auth-context';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { publicKey, signMessage, connected } = useWallet();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const { login } = useAuth();

  const wallet = {
    publicKey: publicKey,
    signMessage: signMessage,
  };

  const loginWithWallet = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Login failed",
        description: "Please connect your wallet to continue",
        variant: "destructive"
      });
      return;
    }
    if (!signMessage) {
      toast({
        title: "Login failed",
        description: "Wallet does not support signing messages. Try a different wallet or update your wallet.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setShowLoadingScreen(true);
    
    try {
      const response = await client.users.signUpWallet(wallet);
      if (response.success) {

       
        login(response.data?.userId ?? '');
        toast({
          title: "Login success",
          description: `Login successful: ${response.data?.userId ?? 'Unknown'}`,
        });
        //@ts-ignore
        if (response.data?.token ?? '') {
          //@ts-ignore
          client.setJwtToken(response.data?.token?? '');
        }
        onOpenChange(false);
      } else {
        toast({
          title: "Login failed",
          description: `Signup failed: ${response.error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.log(`Signup failed: ${error}`);
      toast({
        title: "Login failed",
        description: `Signup failed: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowLoadingScreen(false);
    }
  };

  if (showLoadingScreen) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to Solana Sentiment</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          loginWithWallet();
        }} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2">Logging in...</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>Login</>
              )}
            </Button>
          </DialogFooter>
        </form>
        
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={loginWithWallet}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          Login with Wallet
        </Button>
      </DialogContent>
    </Dialog>
  );
}