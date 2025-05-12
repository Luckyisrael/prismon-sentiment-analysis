import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAuth } from '@/context/auth-context';
import { LoginModal } from './login-modal'; // Import your LoginModal component

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowLogin?: () => void; // Add this prop to handle showing login modal
}

export function SignupModal({ open, onOpenChange, onShowLogin }: SignupModalProps) {
  const { publicKey, signMessage, connected } = useWallet();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // State to control login modal

  const wallet = {
    publicKey: publicKey,
    signMessage: signMessage,
  };

  const handleSignupWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement email signup logic here
     
    // Validate form fields
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Validation Error",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }
  };

  const handleSignupWithWallet = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!connected || !publicKey) {
      toast({
        title: "Signup failed",
        description: "Please connect your wallet to continue",
        variant: "destructive"
      });
      return;
    }

    if (!signMessage) {
      toast({
        title: "Signup failed",
        description: "Wallet does not support signing messages. Try a different wallet or update your wallet.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await client.users.signUpWallet(wallet);
      if (response.success) {
        //login(); // Mark user as authenticated
        toast({
          title: "Signup successful",
          description: `Welcome! Your account has been created.`,
        });
        onOpenChange(false); // Close signup modal
        
        // Show login modal after successful signup
        if (onShowLogin) {
          onShowLogin();
        } else {
          setShowLogin(true);
        }
      } else {
        toast({
          title: "Signup failed",
          description: response.error || "An error occurred during signup",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Signup failed:`, error);
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create an account</DialogTitle>
            <DialogDescription>
              Sign up to start tracking Solana sentiment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignupWithEmail} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  setAcceptTerms(checked as boolean);
                }}
                required
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the terms and conditions
              </Label>
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
              <Button type="submit" disabled={isLoading || !acceptTerms}>
                {isLoading ? (
                  <>
                    <span className="mr-2">Creating account...</span>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>Sign up</>
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
            onClick={() => handleSignupWithWallet()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Continue with Wallet
          </Button>
        </DialogContent>
      </Dialog>

      {/* Render LoginModal if not using parent control */}
      {!onShowLogin && (
        <LoginModal 
          open={showLogin} 
          onOpenChange={setShowLogin} 
        />
      )}
    </>
  );
}