import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletButton } from "@/components/WalletButton";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PriceChart } from "@/components/PriceChart";
import { PredictionButtons } from "@/components/PredictionButtons";
import { AIConfirmation } from "@/components/AIConfirmation";
import { Leaderboard } from "@/components/Leaderboard";
import { PredictionHistory } from "@/components/PredictionHistory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, ExternalLink, Home } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bs58 from "bs58";
import { hashWalletAddress, sanitizeAddressForLog } from "@/lib/walletUtils";
const CARV_RPC = "https://rpc.testnet.carv.io/rpc";
const MIN_SOL_BALANCE = 0.01;
const Index = () => {
  const navigate = useNavigate();
  const {
    publicKey,
    connected,
    signMessage
  } = useWallet();
  const [currentPrice, setCurrentPrice] = useState(1.23);
  const [aiMessage, setAiMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Check SOL balance when wallet connects
  useEffect(() => {
    const checkBalance = async () => {
      if (!connected || !publicKey) {
        setSolBalance(null);
        return;
      }
      setIsCheckingBalance(true);
      try {
        const connection = new Connection(CARV_RPC, "confirmed");
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to check SOL balance:", error);
        setSolBalance(null);
      } finally {
        setIsCheckingBalance(false);
      }
    };
    checkBalance();
  }, [connected, publicKey]);

  // Award 500 points welcome bonus on first connect
  useEffect(() => {
    const initializeUser = async () => {
      if (!connected || !publicKey) return;
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('initialize-user', {
          body: {
            walletAddress: publicKey.toString()
          }
        });
        if (error) {
          console.error("Failed to initialize user:", error);
          return;
        }
        if (data?.success && !data?.alreadyExists) {
          toast.success("Welcome! 🎉", {
            description: "You've received 500 points as a welcome bonus!"
          });
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };
    initializeUser();
  }, [connected, publicKey]);
  const handlePriceUpdate = (newPrice: number) => {
    setCurrentPrice(newPrice);
  };
  const checkActivePrediction = async () => {
    if (!publicKey) return false;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('get-predictions', {
        body: {
          walletAddress: publicKey.toString()
        }
      });
      if (error || !data?.predictions) return false;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const activePrediction = data.predictions.find((pred: any) => pred.status === 'locked' && new Date(pred.created_at) >= today);
      return !!activePrediction;
    } catch (error) {
      console.error('Failed to check active prediction:', error);
      return false;
    }
  };
  const handleCheckPredictions = async () => {
    toast.loading("Checking predictions...");
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('check-predictions');
      toast.dismiss();
      if (error) {
        toast.error("Failed to check predictions");
      } else {
        toast.success(`Checked ${data.processed} predictions`);
        setRefreshHistory(prev => prev + 1);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error checking predictions");
    }
  };
  const handlePrediction = async (direction: "UP" | "DOWN", price: number) => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!signMessage) {
      toast.error("Wallet does not support message signing");
      return;
    }

    // Check SOL balance for gas
    if (solBalance !== null && solBalance < MIN_SOL_BALANCE) {
      toast.error("Insufficient SOL for gas", {
        description: "Get SOL from the bridge to continue",
        action: {
          label: "Get SOL",
          onClick: () => window.open("https://bridge.testnet.carv.io/home", "_blank")
        }
      });
      return;
    }

    // Check for active prediction today
    const hasActivePrediction = await checkActivePrediction();
    if (hasActivePrediction) {
      toast.error("You already have an active prediction!", {
        description: "Only one prediction per day is allowed"
      });
      return;
    }
    setIsLoadingAI(true);
    setAiMessage("");
    try {
      // Step 1: Fetch latest price to ensure accuracy
      const {
        data: priceData,
        error: priceError
      } = await supabase.functions.invoke('get-carv-price');
      if (priceError) {
        toast.error("Failed to get current price");
        setIsLoadingAI(false);
        return;
      }
      const latestPrice = priceData.price;
      setCurrentPrice(latestPrice);
      toast.info(`Locking price at $${latestPrice.toFixed(4)}`);

      // Step 2: Get AI confirmation with latest price
      const {
        data: aiData,
        error: aiError
      } = await supabase.functions.invoke('grok-confirm', {
        body: {
          currentPrice: latestPrice,
          prediction: direction
        }
      });
      if (aiError) throw aiError;
      setAiMessage(aiData.confirmation);

      // Step 3: Generate nonce and create message to sign
      const nonce = `predict_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const message = `CARV Echo Prediction\nNonce: ${nonce}\nPrice: ${latestPrice}\nDirection: ${direction}\nTarget: ${aiData.targetPrice}`;
      console.log("Wallet signing requested for prediction:", sanitizeAddressForLog(publicKey.toString()));
      toast.loading("Signing prediction with your wallet...");

      // Step 4: Request wallet signature
      let signature: string;
      try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = await signMessage(messageBytes);
        signature = bs58.encode(signatureBytes);
        toast.dismiss();
      } catch (signError) {
        toast.dismiss();
        toast.error("Signature required for security - please try again");
        console.error("Signature rejected for", sanitizeAddressForLog(publicKey.toString()));
        setIsLoadingAI(false);
        return;
      }

      // Step 5: Verify signature with backend
      toast.loading("Verifying signature...");
      const {
        data: verifyData,
        error: verifyError
      } = await supabase.functions.invoke('verify-prediction', {
        body: {
          walletAddress: publicKey.toString(),
          prediction: direction,
          currentPrice: latestPrice,
          targetPrice: aiData.targetPrice,
          signature,
          nonce,
          message
        }
      });
      toast.dismiss();
      if (verifyError || !verifyData?.success) {
        console.error("Signature verification failed for", sanitizeAddressForLog(publicKey.toString()));
        toast.error(verifyData?.error || "Invalid signature - please reconnect your wallet");
        setIsLoadingAI(false);
        return;
      }

      // Step 6: Continue with prediction creation
      // Calculate unlock time (next 00:00 UTC)
      const unlockAt = new Date();
      unlockAt.setUTCDate(unlockAt.getUTCDate() + 1);
      unlockAt.setUTCHours(0, 0, 0, 0);

      // Hash wallet address for privacy in metadata
      const hashedWallet = await hashWalletAddress(publicKey.toString());

      // Create metadata (use hashed wallet instead of full address)
      const metadata = {
        name: `CARV Echo Prediction #${Math.floor(Math.random() * 10000)}`,
        description: `Prediction: $CARV will go ${direction} 5% from $${latestPrice}`,
        trader_id: hashedWallet,
        // Anonymous trader ID
        current_price: latestPrice,
        prediction: direction,
        target_price: aiData.targetPrice,
        unlock_at: unlockAt.toISOString(),
        status: "locked",
        created_at: new Date().toISOString()
      };
      setIsMinting(true);

      // Upload to IPFS with signature
      const {
        data: mintData,
        error: mintError
      } = await supabase.functions.invoke('mint-nft', {
        body: {
          metadata,
          signature,
          nonce,
          signedMessage: message
        }
      });
      if (mintError) {
        console.error("IPFS upload failed");
        toast.warning("Prediction saved without IPFS", {
          description: "NFT storage unavailable"
        });
      }

      // Save prediction via secure edge function
      const {
        data: createData,
        error: createError
      } = await supabase.functions.invoke('create-prediction', {
        body: {
          walletAddress: publicKey.toString(),
          hashedWallet: hashedWallet,
          currentPrice: latestPrice,
          prediction: direction,
          targetPrice: parseFloat(aiData.targetPrice),
          unlockAt: unlockAt.toISOString(),
          ipfsUrl: mintData?.ipfsUrl || null,
          signature,
          nonce
        }
      });
      if (createError || !createData?.success) {
        throw new Error(createData?.error || 'Failed to create prediction');
      }
      toast.success("Prediction Created!", {
        description: mintData?.ipfsUrl ? "Verified & Stored on IPFS ✓" : "Verified & Saved"
      });
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      console.error("Prediction creation failed:", error instanceof Error ? error.message : 'Unknown error');
      toast.error("Failed to create prediction");
    } finally {
      setIsLoadingAI(false);
      setIsMinting(false);
    }
  };
  return <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 opacity-30" style={{
      backgroundImage: `url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <header className="mb-12 relative">
          {/* Home Button - Top Left */}
          <div className="absolute top-0 left-0">
            <Button onClick={() => navigate("/")} variant="outline" size="lg" className="gap-2 bg-card/80 backdrop-blur-md border-primary/20 hover:border-primary/40 hover:bg-card/90 transition-all my-[250px] mx-[50px]">
              <Home className="w-5 h-5" />
              Home
            </Button>
          </div>

          {/* Modern Wallet & Balance Display - Top Right */}
          <div className="absolute top-0 right-0">
            {connected ? <div className="group relative mx-[25px]">
                {/* Main Container */}
                <div className="bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-4 shadow-2xl hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:scale-[1.02] min-w-[320px] my-[100px] mx-[20px]">
                  {/* Wallet Section */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-primary/10">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full blur-md opacity-50 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full p-2 border border-primary/30">
                        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Connected Wallet</p>
                      <WalletButton />
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent to-primary rounded-lg blur-sm opacity-40"></div>
                        <div className="relative bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg p-2 border border-accent/30">
                          <Fuel className="h-5 w-5 text-accent" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Gas Balance</p>
                        {isCheckingBalance ? <div className="flex items-center gap-2">
                            <div className="h-3 w-16 bg-muted/30 rounded animate-pulse"></div>
                          </div> : solBalance !== null ? <div className="flex items-center gap-2">
                            <p className="text-xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                              {solBalance.toFixed(3)}
                            </p>
                            <span className="text-xs font-bold text-accent">SOL</span>
                            {solBalance < MIN_SOL_BALANCE && <Badge variant="destructive" className="text-[9px] py-0.5 px-2 animate-pulse">
                                Low
                              </Badge>}
                          </div> : <p className="text-sm text-muted-foreground">N/A</p>}
                      </div>
                    </div>

                    {/* Bridge Link Button */}
                    <a href="https://bridge.testnet.carv.io/home" target="_blank" rel="noopener noreferrer" className="group/link relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 hover:border-primary/60 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]" title="Get SOL from Bridge">
                      <ExternalLink className="h-4 w-4 text-primary group-hover/link:text-secondary transition-colors" />
                    </a>
                  </div>

                  {/* Decorative Gradient Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-accent rounded-b-2xl opacity-50"></div>
                </div>
              </div> : <div className="bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-primary/20 rounded-2xl p-4 shadow-2xl hover:shadow-[0_0_40px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:scale-[1.02]">
                <WalletButton />
              </div>}
          </div>

          {/* Centered Title */}
          <div className="text-center pt-4 mx-0">
            <h1 className="mb-4 bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text my-[50px] tracking-tight animate-fade-in text-left text-7xl font-extrabold text-violet-600">   CARV Echo</h1>
            <p style={{
            animationDelay: '0.1s'
          }} className="text-2xl text-foreground/90 font-light animate-fade-in text-left">         Daily 5% Prediction Game on $CARV<span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent font-bold"> </span>
            </p>
            <p style={{
            animationDelay: '0.2s'
          }} className="text-sm text-muted-foreground mt-2 animate-fade-in text-left">                CARV SVM Testnet</p>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto my-[100px]">
          {/* Left Column - Game */}
          <div className="lg:col-span-2 space-y-8">
            <PriceDisplay onPriceUpdate={handlePriceUpdate} />
            <PriceChart />
            <PredictionButtons currentPrice={currentPrice} onPredict={handlePrediction} disabled={!connected || isLoadingAI || isMinting} />
            <AIConfirmation message={aiMessage} isLoading={isLoadingAI || isMinting} />
            <PredictionHistory walletAddress={connected ? publicKey?.toString() || null : null} refreshTrigger={refreshHistory} onCheckPredictions={connected ? handleCheckPredictions : undefined} />
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-8">
            <Leaderboard />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-muted-foreground">
          <p className="text-sm">
            Powered by CARV SVM Testnet • RPC: https://rpc.testnet.carv.io/rpc
          </p>
        </footer>
      </div>
    </div>;
};
export default Index;