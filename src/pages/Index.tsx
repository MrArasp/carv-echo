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

const Index = () => {
  const { publicKey, connected } = useWallet();
  const [currentPrice, setCurrentPrice] = useState(1.23);
  const [aiMessage, setAiMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handlePrediction = async (direction: "UP" | "DOWN", price: number) => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoadingAI(true);
    setAiMessage("");

    try {
      // Get AI confirmation
      const { data: aiData, error: aiError } = await supabase.functions.invoke('grok-confirm', {
        body: { currentPrice: price, prediction: direction }
      });

      if (aiError) throw aiError;
      setAiMessage(aiData.confirmation);

      // Calculate unlock time (next 00:00 UTC)
      const unlockAt = new Date();
      unlockAt.setUTCDate(unlockAt.getUTCDate() + 1);
      unlockAt.setUTCHours(0, 0, 0, 0);

      // Create metadata
      const metadata = {
        name: `CARV Echo Prediction #${Math.floor(Math.random() * 10000)}`,
        description: `Prediction: $CARV will go ${direction} 5% from $${price}`,
        current_price: price,
        prediction: direction,
        target_price: aiData.targetPrice,
        unlock_at: unlockAt.toISOString(),
        status: "locked",
        created_at: new Date().toISOString(),
      };

      setIsMinting(true);

      // Upload to IPFS
      const { data: mintData, error: mintError } = await supabase.functions.invoke('mint-nft', {
        body: { metadata }
      });

      if (mintError) {
        console.error("IPFS upload error:", mintError);
        toast.warning("Prediction saved without IPFS", {
          description: "NFT storage unavailable",
        });
      }

      // Save prediction to database (with or without IPFS URL)
      const { error: dbError } = await supabase.from('predictions').insert({
        wallet_address: publicKey.toString(),
        current_price: price,
        prediction: direction,
        target_price: parseFloat(aiData.targetPrice),
        unlock_at: unlockAt.toISOString(),
        ipfs_url: mintData?.ipfsUrl || null,
        status: 'locked',
      });

      if (dbError) throw dbError;

      toast.success("Prediction Created!", {
        description: mintData?.ipfsUrl ? "Stored on IPFS ✓" : "Saved to database",
      });

      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      console.error("Error:", error);
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
            <PriceDisplay />
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
