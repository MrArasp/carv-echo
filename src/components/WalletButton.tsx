import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield } from "lucide-react";
import { truncateAddress } from "@/lib/walletUtils";

export const WalletButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <Card className="p-3 bg-card/50 backdrop-blur-sm border-primary/20">
      <WalletMultiButton 
        className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-10 !px-4 !font-bold glow-primary !transition-all !text-sm" 
      />
      {connected && publicKey && (
        <div className="flex items-center justify-between mt-2 px-1">
          <Badge variant="outline" className="text-xs font-mono">
            {truncateAddress(publicKey.toString())}
          </Badge>
          <div className="flex items-center gap-1 text-success text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span className="text-[10px]">CARV SVM</span>
          </div>
        </div>
      )}
    </Card>
  );
};
