import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PredictionButtons } from "@/components/PredictionButtons";
import { AIConfirmation } from "@/components/AIConfirmation";
import { Leaderboard } from "@/components/Leaderboard";
import { PredictionHistory } from "@/components/PredictionHistory";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import bs58 from "bs58";
import { hashWalletAddress, sanitizeAddressForLog } from "@/lib/walletUtils";

const Index = () => {
  const { publicKey, connected, signMessage } = useWallet();
  const [currentPrice, setCurrentPrice] = useState(1.23);
  const [aiMessage, setAiMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handlePriceUpdate = (newPrice: number) => {
    setCurrentPrice(newPrice);
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

    setIsLoadingAI(true);
    setAiMessage("");

    try {
      // Step 1: Get AI confirmation first to get target price
      const { data: aiData, error: aiError } = await supabase.functions.invoke('grok-confirm', {
        body: { currentPrice: price, prediction: direction }
      });

      if (aiError) throw aiError;
      setAiMessage(aiData.confirmation);

      // Step 2: Generate nonce and create message to sign
      const nonce = `predict_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const message = `CARV Echo Prediction\nNonce: ${nonce}\nPrice: ${price}\nDirection: ${direction}\nTarget: ${aiData.targetPrice}`;
      
      console.log("Wallet signing requested for prediction:", sanitizeAddressForLog(publicKey.toString()));
      toast.loading("Signing prediction with your wallet...");

      // Step 3: Request wallet signature
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

      // Step 4: Verify signature with backend
      toast.loading("Verifying signature...");
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-prediction', {
        body: {
          walletAddress: publicKey.toString(),
          prediction: direction,
          currentPrice: price,
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

      // Step 5: Continue with prediction creation
      // Calculate unlock time (next 00:00 UTC)
      const unlockAt = new Date();
      unlockAt.setUTCDate(unlockAt.getUTCDate() + 1);
      unlockAt.setUTCHours(0, 0, 0, 0);

      // Hash wallet address for privacy in metadata
      const hashedWallet = await hashWalletAddress(publicKey.toString());

      // Create metadata (use hashed wallet instead of full address)
      const metadata = {
        name: `CARV Echo Prediction #${Math.floor(Math.random() * 10000)}`,
        description: `Prediction: $CARV will go ${direction} 5% from $${price}`,
        trader_id: hashedWallet, // Anonymous trader ID
        current_price: price,
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
        current_price: price,
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
        <header className="mb-12 text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse-glow">
            CARV Echo
          </h1>
          <p className="text-xl text-muted-foreground">
            Daily 5% Prediction Game on $CARV • CARV SVM Testnet
          </p>
        </header>

        {/* Wallet Connect */}
        <div className="max-w-md mx-auto mb-8">
          <WalletButton />
        </div>

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
