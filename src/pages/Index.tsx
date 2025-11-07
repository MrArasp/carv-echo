import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletButton } from "@/components/WalletButton";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PredictionButtons } from "@/components/PredictionButtons";
import { AIConfirmation } from "@/components/AIConfirmation";
import { Leaderboard } from "@/components/Leaderboard";
import { PredictionHistory } from "@/components/PredictionHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fuel, ExternalLink, AlertCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bs58 from "bs58";
import { hashWalletAddress, sanitizeAddressForLog } from "@/lib/walletUtils";

const CARV_RPC = "https://rpc.testnet.carv.io/rpc";
const MIN_SOL_BALANCE = 0.01;

const Index = () => {
  const { publicKey, connected, signMessage } = useWallet();
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
        const { data, error } = await supabase.functions.invoke('initialize-user', {
          body: { walletAddress: publicKey.toString() }
        });

        if (error) {
          console.error("Failed to initialize user:", error);
          return;
        }

        if (data?.success && !data?.alreadyExists) {
          toast.success("Welcome! 🎉", {
            description: "You've received 500 points as a welcome bonus!",
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
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('predictions')
      .select('id')
      .eq('wallet_address', publicKey.toString())
      .eq('status', 'locked')
      .gte('created_at', today.toISOString())
      .maybeSingle();
      
    return !!data;
  };

  const handleCheckPredictions = async () => {
    toast.loading("Checking predictions...");
    try {
      const { data, error } = await supabase.functions.invoke('check-predictions');
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
          onClick: () => window.open("https://bridge.testnet.carv.io/home", "_blank"),
        },
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
      const { data: priceData, error: priceError } = await supabase.functions.invoke('get-carv-price');
      
      if (priceError) {
        toast.error("Failed to get current price");
        setIsLoadingAI(false);
        return;
      }
      
      const latestPrice = priceData.price;
      setCurrentPrice(latestPrice);
      
      toast.info(`Locking price at $${latestPrice.toFixed(4)}`);

      // Step 2: Get AI confirmation with latest price
      const { data: aiData, error: aiError } = await supabase.functions.invoke('grok-confirm', {
        body: { currentPrice: latestPrice, prediction: direction }
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
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-prediction', {
        body: {
          walletAddress: publicKey.toString(),
          prediction: direction,
          currentPrice: latestPrice,
          targetPrice: aiData.targetPrice,
          signature,
          nonce,
          message,
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
        trader_id: hashedWallet, // Anonymous trader ID
        current_price: latestPrice,
        prediction: direction,
        target_price: aiData.targetPrice,
        unlock_at: unlockAt.toISOString(),
        status: "locked",
        created_at: new Date().toISOString(),
      };

      setIsMinting(true);

      // Upload to IPFS with signature
      const { data: mintData, error: mintError } = await supabase.functions.invoke('mint-nft', {
        body: { 
          metadata,
          signature,
          nonce,
          signedMessage: message,
        }
      });

      if (mintError) {
        console.error("IPFS upload failed");
        toast.warning("Prediction saved without IPFS", {
          description: "NFT storage unavailable",
        });
      }

      // Save prediction to database with signature proof and hashed wallet
      const { error: dbError } = await supabase.from('predictions').insert({
        wallet_address: publicKey.toString(),
        hashed_wallet: hashedWallet,
        current_price: latestPrice,
        prediction: direction,
        target_price: parseFloat(aiData.targetPrice),
        unlock_at: unlockAt.toISOString(),
        ipfs_url: mintData?.ipfsUrl || null,
        status: 'locked',
        signature,
        nonce,
      });

      if (dbError) throw dbError;

      toast.success("Prediction Created!", {
        description: mintData?.ipfsUrl ? "Verified & Stored on IPFS ✓" : "Verified & Saved",
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 space-y-4">
          {/* Centered Title - Top */}
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-glow">
              CARV Echo
            </h1>
            <p className="text-xl text-muted-foreground">
              Daily 5% Prediction Game on $CARV • CARV SVM Testnet
            </p>
          </div>

          {/* Wallet & Balance - Below Title */}
          <div className="flex justify-end gap-2">
            {/* Wallet Card */}
            <WalletButton />
            
            {/* Balance Card */}
            {connected && (
              <Card className="p-2 bg-card/50 backdrop-blur-sm border-primary/20">
                <div className="flex items-center gap-2">
                  <Fuel className="h-3 w-3 text-primary" />
                  <div className="flex-1 min-w-[100px]">
                    <p className="text-[10px] font-medium">Gas</p>
                    {isCheckingBalance ? (
                      <p className="text-[10px] text-muted-foreground">...</p>
                    ) : solBalance !== null ? (
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold">
                          {solBalance.toFixed(3)} SOL
                        </p>
                        {solBalance < MIN_SOL_BALANCE && (
                          <Badge variant="destructive" className="text-[8px] py-0 px-1 h-3">
                            Low
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">N/A</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open("https://bridge.testnet.carv.io/home", "_blank")}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Game */}
          <div className="lg:col-span-2 space-y-8">
            <PriceDisplay onPriceUpdate={handlePriceUpdate} />
            <PredictionButtons
              currentPrice={currentPrice} 
              onPredict={handlePrediction}
              disabled={!connected || isLoadingAI || isMinting}
            />
            <AIConfirmation 
              message={aiMessage} 
              isLoading={isLoadingAI || isMinting}
            />
            <PredictionHistory 
              walletAddress={connected ? publicKey?.toString() || null : null}
              refreshTrigger={refreshHistory}
              onCheckPredictions={connected ? handleCheckPredictions : undefined}
            />
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
    </div>
  );
};

export default Index;
