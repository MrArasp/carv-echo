import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const WalletButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex flex-col gap-3">
        <WalletMultiButton 
          className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-12 !px-6 !font-bold glow-primary !transition-all" 
        />
        {connected && publicKey && (
          <div className="flex items-center justify-between px-2">
            <Badge variant="outline" className="text-xs font-mono">
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </Badge>
            <div className="flex items-center gap-2 text-success text-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>CARV SVM Testnet</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
