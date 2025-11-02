import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Lock } from "lucide-react";
import { toast } from "sonner";

interface NFTData {
  currentPrice: number;
  prediction: "UP" | "DOWN";
  targetPrice: string;
  timestamp: string;
}

interface NFTMintCardProps {
  nftData: NFTData | null;
}

export const NFTMintCard = ({ nftData }: NFTMintCardProps) => {
  const handleMint = () => {
    if (!nftData) return;

    // Mock NFT minting
    // In production, integrate with CARV SVM testnet
    toast.success("NFT Minted!", {
      description: `CARV Echo #${Math.floor(Math.random() * 1000)} created`,
    });
  };

  if (!nftData) {
    return (
      <Card className="p-6 bg-card/30 backdrop-blur-sm border-primary/10">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Make a prediction to mint your NFT
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm border-primary/20">
      <h3 className="text-xl font-bold mb-4">Mint Prediction NFT</h3>
      
      <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-primary/10">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="h-8 w-8 text-primary" />
          <div>
            <p className="font-semibold text-lg">CARV Echo #{Math.floor(Math.random() * 1000)}</p>
            <Badge variant={nftData.prediction === "UP" ? "default" : "destructive"}>
              {nftData.prediction} 5%
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-mono">${nftData.currentPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Price:</span>
            <span className="font-mono">${nftData.targetPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unlock:</span>
            <span className="font-mono">00:00 UTC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline">Locked</Badge>
          </div>
        </div>
      </div>

      <Button
        onClick={handleMint}
        variant="glow"
        size="lg"
        className="w-full"
      >
        Mint NFT
      </Button>
    </Card>
  );
};
