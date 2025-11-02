import { useState } from "react";
import { WalletConnect } from "@/components/WalletConnect";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PredictionButtons } from "@/components/PredictionButtons";
import { AIConfirmation } from "@/components/AIConfirmation";
import { NFTMintCard } from "@/components/NFTMintCard";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/integrations/supabase/client";

interface NFTData {
  currentPrice: number;
  prediction: "UP" | "DOWN";
  targetPrice: string;
  timestamp: string;
}

const Index = () => {
  const [currentPrice, setCurrentPrice] = useState(1.23);
  const [aiMessage, setAiMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [nftData, setNftData] = useState<NFTData | null>(null);

  const handlePrediction = async (direction: "UP" | "DOWN", price: number) => {
    setIsLoadingAI(true);
    setAiMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('grok-confirm', {
        body: { currentPrice: price, prediction: direction }
      });

      if (error) throw error;

      setAiMessage(data.confirmation);
      
      // Set NFT data for minting
      setNftData({
        currentPrice: price,
        prediction: direction,
        targetPrice: data.targetPrice,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting AI confirmation:", error);
      setAiMessage("Error getting confirmation. Please try again.");
    } finally {
      setIsLoadingAI(false);
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
          <WalletConnect />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column */}
          <div className="space-y-8">
            <PriceDisplay />
            <PredictionButtons 
              currentPrice={currentPrice} 
              onPredict={handlePrediction}
            />
            <AIConfirmation 
              message={aiMessage} 
              isLoading={isLoadingAI}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <NFTMintCard nftData={nftData} />
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
